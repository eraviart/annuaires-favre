import { db } from "../database"
import { slugify } from "../strings"
import {
  numberFromString,
  validateChain,
  validateInteger,
  validateMaybeTrimmedString,
  validateString,
  validateTest,
} from "../validators/core"

export async function get(req, res) {
  const [query, error] = validateQuery(req.query)
  if (error !== null) {
    console.error(
      `Error in autocompletion query:\n${JSON.stringify(query, null, 2)}\n\nError:\n${JSON.stringify(error, null, 2)}`
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
            message: "Invalid autocompletion query",
          },
        },
        null,
        2
      )
    )
  }

  const result = await db.any(
    `
      SELECT DISTINCT
        slug <-> $<term> AS distance,
        city AS id,
        insee_code_short,
        name
      FROM city_names
      INNER JOIN cities ON
        city_names.city = cities.id
        AND cities.startdate <= $<yearEnd>
        AND cities.enddate >= $<yearStart>
      INNER JOIN city_district ON
        cities.id = city_district.city_id
        AND city_district.district_id = $<districtId>
        AND city_district.startdate <= $<yearEnd>
        AND city_district.enddate >= $<yearStart>
      INNER JOIN districts ON
        city_district.district_id = districts.id
        AND districts.startdate <= $<yearEnd>
        AND districts.enddate >= $<yearStart>
      WHERE
        city_names.startdate <= $<yearEnd>
        AND city_names.enddate >= $<yearStart>
      ORDER BY distance ASC
      LIMIT $<limit>
    `,
    {
      districtId: query.district,
      limit: 10,
      term: slugify(query.q || ""),
      yearEnd: `${query.year}-12-31`,
      yearStart: `${query.year}-01-01`,
    },
  )

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

  {
    const key = "district"
    remainingKeys.delete(key)
    const [value, error] = validateChain([
      validateString,
      numberFromString,
      validateInteger,
      validateTest(value => value >= 0, "Le nombre doit être positif ou nul."),
    ])(query[key])
    query[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "q"
    remainingKeys.delete(key)
    const [value, error] = validateMaybeTrimmedString(query[key])
    query[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "year"
    remainingKeys.delete(key)
    const [value, error] = validateChain([
      validateString,
      numberFromString,
      validateInteger,
      validateTest(value => value >= 1700 && value < 2000, "Expected a year between 1700 and 1999"),
    ])(query[key])
    query[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Unexpected entry"
  }
  return [query, Object.keys(errors).length === 0 ? null : errors]
}
