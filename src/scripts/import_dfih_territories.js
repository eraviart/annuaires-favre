import { db } from "../database"
import { slugify } from "../strings"
import { createPool } from "../oracle"

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
            iso_code,
            source
          FROM countries
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            INSERT INTO countries VALUES ($1, $2, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          SELECT
            country,
            name,
            startdate,
            enddate,
            source
          FROM country_names
        `,
      )).rows
      for (let row of rows) {
        row = [...row, slugify(row[1])]
        await db.none(
          `
            INSERT INTO country_names VALUES ($1, $2, $6, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          SELECT
            id,
            startdate,
            enddate,
            postal_code,
            source
          FROM districts
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            INSERT INTO districts VALUES ($1, $2, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          SELECT
            district_id,
            country_id,
            startdate,
            enddate,
            source
          FROM country_district
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            INSERT INTO country_district VALUES ($1, $2, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          SELECT
            district,
            name,
            startdate,
            enddate,
            source
          FROM district_names
        `,
      )).rows
      for (let row of rows) {
        row = [...row, slugify(row[1])]
        await db.none(
          `
            INSERT INTO district_names VALUES ($1, $2, $6, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          SELECT
            id,
            startdate,
            enddate,
            insee_code_long,
            insee_code_short,
            source
          FROM cities
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            INSERT INTO cities VALUES ($1, $2, $3, $4, $5, $6)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          SELECT
            district_id,
            city_id,
            startdate,
            enddate,
            source
          FROM city_district
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            INSERT INTO city_district VALUES ($1, $2, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          SELECT
            city,
            name,
            startdate,
            enddate,
            source
          FROM city_names
        `,
      )).rows
      for (let row of rows) {
        row = [...row, slugify(row[1])]
        await db.none(
          `
            INSERT INTO city_names VALUES ($1, $2, $6, $3, $4, $5)
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
