import { db } from "../database"
import { slugify } from "../strings"
import { validateMaybeTrimmedString } from "../validators/core"

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
      SELECT DISTINCT
        cn.slug <-> $<term> AS distance,
        c.id,
        cn.name
      FROM corporation_names cn
      JOIN corporations c ON cn.corporation = c.id
      WHERE c.bank
      ORDER BY distance ASC
      LIMIT $<limit>
    `,
    {
      limit: 10,
      term: slugify(query.q || ""),
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

  for (let key of remainingKeys) {
    errors[key] = "Unexpected entry"
  }
  return [query, Object.keys(errors).length === 0 ? null : errors]
}
