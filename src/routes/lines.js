import { db } from "../database"
import {
  validateStringToNumber,
  validateInteger,
  validateMissing,
  validateOption,
  validateString,
  validateTest,
} from "../validators/core"

export async function get(req, res) {
  const [query, error] = validateQuery(req.query)
  if (error !== null) {
    console.error(
      `Error in lines query:\n${JSON.stringify(query, null, 2)}\n\nError:\n${JSON.stringify(error, null, 2)}`
    )
    res.writeHead(400, {
      "Content-Type": "application/json; charset=utf-8",
    })
    return res.end(
      JSON.stringify(
        {
          ...query,
          error: {
            code: 400,
            details: error,
            message: "Invalid lines query",
          },
        },
        null,
        2
      )
    )
  }

  const whereClauses = []

  if (query.city !== null) {
    whereClauses.push("city_id = $<city>")
  }

  if (query.district !== null) {
    whereClauses.push("district_id = $<district>")
  }

  if (query.page !== null) {
    whereClauses.push("page = $<page>")
  }

  if (query.user !== null) {
    whereClauses.push("user_id = $<user>")
  }

  if (query.year !== null) {
    whereClauses.push("year = $<year>")
  }

  const whereClause = whereClauses.length === 0 ? "" : "WHERE " + whereClauses.join(" AND ")

  const result = (await db.any(
    `
      SELECT
        lines.id,
        lines.city_id,
        lines.city_name,
        lines.comment,
        lines.corporation_id,
        lines.corporation_name,
        lines.district_id,
        lines.district_name,
        lines.page,
        lines.temporary,
        lines.user_id,
        users.name AS user_name,
        lines.year
      FROM lines
      JOIN users ON lines.user_id = users.id
      ${whereClause}
      ORDER BY lines.id
    `,
    {
      ...query,
      whereClause,
    },
  ))
    .map(row => {
      return {
        id: row.id,
        cityId: row.city_id,
        cityName: row.city_name,
        comment: row.comment,
        corporationId: row.corporation_id,
        corporationName: row.corporation_name,
        districtId: row.district_id,
        districtName: row.district_name,
        page: row.page,
        temporary: row.temporary,
        userId: row.user_id,
        userName: row.user_name,
        year: row.year,
      }
    })

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  })
  res.end(JSON.stringify(result, null, 2))
}

function validateQuery(query) {
  if (query === null || query === undefined) {
    return [query, "Missing query"]
  }
  if (typeof query !== "object") {
    return [query, `Expected an object, got ${typeof query}`]
  }

  query = {
    ...query,
  }
  const remainingKeys = new Set(Object.keys(query))
  const errors = {}

  for (let key of ["city", "district", "page", "user"]) {
    remainingKeys.delete(key)
    const [value, error] = validateOption([
      validateMissing,
      [
        validateString,
        validateStringToNumber,
        validateInteger,
        validateTest(value => value >= 0, "Le nombre doit être positif ou nul."),
      ],
    ])(query[key])
    query[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "year"
    remainingKeys.delete(key)
    const [value, error] = validateOption([
      validateMissing,
      [
        validateString,
        validateStringToNumber,
        validateInteger,
        validateTest(value => value >= 1700 && value < 2000, "Expected a year between 1700 and 1999"),
      ],
    ])(query[key])
    query[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Ce champ est inattendu."
  }
  return [query, Object.keys(errors).length === 0 ? null : errors]
}
