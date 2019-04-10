import { db } from "../database"
import { slugify } from "../strings"
import {
  validateChain,
  validateInteger,
  validateNonEmptyTrimmedString,
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
            message: "L'utilisateur n'est pas authentifié.",
          },
        },
        null,
        2
      )
    )
  }

  const [body, error] = await validateBody(req.body)
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
            message: "Le formulaire contient des erreurs.",
          },
        },
        null,
        2
      )
    )
  }

  const result = { ...body }
  const { id } = await db.one(
    `
      INSERT INTO corporations (
        startdate,
        enddate,
        source
      )
      VALUES (
        '1000-01-01',
        '3999-12-30',
        null
      )
      RETURNING id
    `,
  )
  result.id = id

  await db.none(
    `
      INSERT INTO corporation_names (
        corporation,
        name,
        slug,
        startdate,
        enddate,
        source,
        comments
      )
      VALUES (
        $<id>,
        $<corporationName>,
        $<slug>,
        '1000-01-01',
        '3999-12-30',
        null,
        null
      )
    `,
    {
      corporationName: body.corporationName,
      slug: slugify(body.corporationName),
      id,
    }
  )

  await db.none(
    `
      INSERT INTO dummy_corporations (
        corporation_id,
        created_at,
        page,
        user_id,
        year
      )
      VALUES (
        $<id>,
        current_timestamp,
        $<page>,
        $<userId>,
        $<year>
      )
    `,
    {
      corporationName: body.corporationName,
      id,
      page: body.page,
      userId: user.id,
      year: body.year,
    }
  )

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  })
  res.end(JSON.stringify(result, null, 2))
}

async function validateBody(body) {
  if (body === null || body === undefined) {
    return [body, "Le formulaire est vide."]
  }
  if (typeof body !== "object") {
    return [body, `Le formulaire devrait être un "object" et non pas un "${typeof body}".`]
  }

  body = {
    ...body,
  }
  const remainingKeys = new Set(Object.keys(body))
  const errors = {}

  for (let key of ["corporationName"]) {
    remainingKeys.delete(key)
    const [value, error] = validateNonEmptyTrimmedString(body[key])
    body[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of ["page", "year"]) {
    remainingKeys.delete(key)
    const [value, error] = validateChain([
      validateInteger,
      validateTest(value => value >= 0, "Le nombre doit être positif ou nul."),
    ])(body[key])
    body[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Ce champ est inattendu."
  }
  return [body, Object.keys(errors).length === 0 ? null : errors]
}
