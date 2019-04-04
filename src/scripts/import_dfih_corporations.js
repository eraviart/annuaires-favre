import { createPool } from "../oracle"
import { db } from "../database"

let pool = null

async function main() {
  const connection = await pool.getConnection()
  try {
    {
      const rows = (await connection.execute(
        `
          SELECT
            id,
            startdate,
            enddate,
            source
          FROM corporation
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            INSERT INTO corporations VALUES ($1, $2, $3, $4)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          SELECT
            corporation,
            name,
            startdate,
            enddate,
            source,
            comments
          FROM corporation_name
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            INSERT INTO corporation_names
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT
              DO NOTHING
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          SELECT
            corporation,
            truename,
            startdate,
            enddate,
            source
          FROM corporation_true_name
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            INSERT INTO corporation_names
              VALUES ($1, $2, $3, $4, $5, null)
              ON CONFLICT
              DO NOTHING
          `,
          row,
        )
      }
    }
  } finally {
    connection.close()
  }
}

createPool()
  .then(newPool => {
    pool = newPool
    main().catch(error => {
      console.log(error.stack || error)
      process.exit(1)
    })
  })
  .catch(error => {
    console.log(error.stack || error)
    process.exit(1)
  })
