import { db } from "../database"
import {
  validateBoolean,
  validateChain,
  validateInteger,
  validateMaybeTrimmedString,
  validateMissing,
  validateNonEmptyTrimmedString,
  validateOption,
  validateTest,
} from "../validators/core"

export async function post(req, res) {
  const { user } = req
  if (!user) {
    res.writeHead(401, {
      "Content-Type": "application/json; charset=utf-8",
    })
    return res.end(
      JSON.stringify(
        {
          error: {
            code: 401,
            message: "Unauthorized: User is not authenticated.",
          },
        },
        null,
        2
      )
    )
  }

  const [body, error] = validateBody(req.body)
  if (error !== null) {
    console.error(
      `Error in form:\n${JSON.stringify(body, null, 2)}\n\nError:\n${JSON.stringify(error, null, 2)}`
    )
    res.writeHead(400, {
      "Content-Type": "application/json; charset=utf-8",
    })
    return res.end(
      JSON.stringify(
        {
          ...body,
          error: {
            code: 400,
            details: error,
            message: "Invalid body for form",
          },
        },
        null,
        2
      )
    )
  }

  const result = { ...body }
  if (body.lineId === null) {
    const { id } = await db.one(
      `
        INSERT INTO lines (
          city_id,
          city_name,
          comment,
          corporation_id,
          corporation_name,
          district_id,
          district_name,
          page,
          temporary,
          user_id,
          year,
          created_at,
          updated_at
        )
        VALUES (
          $<cityId>,
          $<cityName>,
          $<comment>,
          $<corporationId>,
          $<corporationName>,
          $<districtId>,
          $<districtName>,
          $<page>,
          $<temporary>,
          $<userId>,
          $<year>,
          current_timestamp,
          current_timestamp
        )
        RETURNING id
      `,
      {
        ...body,
        userId: user.id,
      },
    )
    result.id = id
  } else {
    await db.none(
      `
        UPDATE lines
        SET
          city_id = $<cityId>,
          city_name = $<cityName>,
          comment = $<comment>,
          corporation_id = $<corporationId>,
          corporation_name = $<corporationName>,
          district_id = $<districtId>,
          district_name = $<districtName>,
          page = $<page>,
          temporary = $<temporary>,
          user_id = $<userId>,
          year = $<year>,
          updated_at = current_timestamp
        WHERE id = $<lineId>
      `,
      {
        ...body,
        userId: user.id,
      },
    )
  }

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  })
  res.end(JSON.stringify(result, null, 2))
}

function validateBody(body) {
  if (body === null || body === undefined) {
    return [body, "Missing body"]
  }
  if (typeof body !== "object") {
    return [body, `Expected an object, got ${typeof body}`]
  }

  body = {
    ...body,
  }
  const remainingKeys = new Set(Object.keys(body))
  const errors = {}

  for (let key of ["cityId", "corporationId", "districtId", "page", "year"]) {
    remainingKeys.delete(key)
    const [value, error] = validateChain([
      validateInteger,
      validateTest(value => value >= 0, "Expected a positive or zero integer"),
    ])(body[key])
    body[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of ["cityName", "corporationName", "districtName"]) {
    remainingKeys.delete(key)
    const [value, error] = validateNonEmptyTrimmedString(body[key])
    body[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "comment"
    remainingKeys.delete(key)
    const [value, error] = validateMaybeTrimmedString(body[key])
    body[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "lineId"
    remainingKeys.delete(key)
    const [value, error] = validateOption([
      validateMissing,
      [
        validateInteger,
        validateTest(value => value >= 0, "Expected a positive or zero integer"),
      ],
    ])(body[key])
    body[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "temporary"
    remainingKeys.delete(key)
    const [value, error] = validateBoolean(body[key])
    body[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Unexpected entry"
  }
  return [body, Object.keys(errors).length === 0 ? null : errors]
}
