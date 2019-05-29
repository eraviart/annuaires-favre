import { db } from "../database"
import { slugify } from "../strings"
import {
  validateStringToNumber,
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
      `Error in autocompletion query:\n${JSON.stringify(
        query,
        null,
        2,
      )}\n\nError:\n${JSON.stringify(error, null, 2)}`,
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
        2,
      ),
    )
  }

  const result = await db.any(
    `
      SELECT
        slug <-> $<term> AS distance,
        district AS id,
        name,
        postal_code
      FROM district_names
      INNER JOIN districts ON
        district_names.district = districts.id
        AND districts.startdate <= $<yearEnd>
        AND districts.enddate >= $<yearStart>
      INNER JOIN country_district ON
        districts.id = country_district.district_id
        AND country_district.startdate <= $<yearEnd>
        AND country_district.enddate >= $<yearStart>
      INNER JOIN countries ON
        country_district.country_id = countries.id
        AND countries.iso_code = 'FR'
        AND countries.startdate <= $<yearEnd>
        AND countries.enddate >= $<yearStart>
      WHERE
        district_names.startdate <= $<yearEnd>
        AND district_names.enddate >= $<yearStart>
      ORDER BY distance ASC
      LIMIT $<limit>
    `,
    {
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
      validateStringToNumber,
      validateInteger,
      validateTest(
        value => value >= 1700 && value < 2000,
        "Expected a year between 1700 and 1999",
      ),
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
