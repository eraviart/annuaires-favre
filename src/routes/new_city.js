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
      INSERT INTO cities (
        startdate,
        enddate
      )
      VALUES (
        '1000-01-01',
        '3999-12-30'
      )
      RETURNING id
    `,
  )
  result.id = id

  await db.none(
    `
      INSERT INTO city_district (
        district_id,
        city_id,
        startdate,
        enddate
      )
      VALUES (
        $<districtId>,
        $<id>,
        '1000-01-01',
        '3999-12-30'
      )
    `,
    {
      districtId: body.districtId,
      id,
    }
  )

  await db.none(
    `
      INSERT INTO city_names (
        city,
        name,
        slug,
        startdate,
        enddate
      )
      VALUES (
        $<id>,
        $<cityName>,
        $<slug>,
        '1000-01-01',
        '3999-12-30'
      )
    `,
    {
      cityName: body.cityName,
      id,
      slug: slugify(body.cityName),
    }
  )

  await db.none(
    `
      INSERT INTO dummy_cities (
        city_id,
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
      cityName: body.cityName,
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

  for (let key of ["cityName"]) {
    remainingKeys.delete(key)
    let [value, error] = validateNonEmptyTrimmedString(body[key])
    body[key] = value
    if (error === null) {
      const slug = slugify(value)
      if (!slug) {
        error = "Le texte ne contient aucun caractère signifiant."
      } else if ((await db.one("SELECT EXISTS(SELECT * FROM city_names WHERE slug=$1)", [slug])) .exists) {
        error = "Une localité ayant un nom similaire existe déjà."
      }
    }
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of ["districtId", "page", "year"]) {
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
