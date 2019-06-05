import { db } from "../database"
import {
  validateStringToNumber,
  validateChain,
  validateInteger,
  validateString,
  validateTest,
} from "../validators/core"

export async function get(req, res) {
  const [query, error] = validateQuery(req.query)
  if (error !== null) {
    console.error(
      `Error in pages query:\n${JSON.stringify(
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
            message: "Invalid pages query",
          },
        },
        null,
        2,
      ),
    )
  }

  const pages = (await db.any(
    `
      SELECT
        distinct page
      FROM lines
      where year = $<year>
      ORDER BY page
    `,
    query,
  )).map (({ page }) => page)

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  })
  res.end(JSON.stringify(pages, null, 2))
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
