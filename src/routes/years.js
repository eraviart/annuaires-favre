import { db } from "../database"

export async function get(req, res) {
  const years = (await db.any(
    `
      SELECT
        distinct year
      FROM lines
      ORDER BY year
    `,
  )).map (({ year }) => year)

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  })
  res.end(JSON.stringify(years, null, 2))
}
