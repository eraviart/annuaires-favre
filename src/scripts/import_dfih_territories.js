import oracledb from "oracledb"

import { createPool, objectsFromSqlResult } from "../oracle"
import { db } from "../database"

let pool = null

async function main() {
  const connection = await pool.getConnection()
  try {
    {
      const rows = (await connection.execute(
        `
          select
            id,
            startdate,
            enddate,
            iso_code,
            source
          from countries
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            insert into countries values ($1, $2, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          select
            country,
            name,
            startdate,
            enddate,
            source
          from country_names
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            insert into country_names values ($1, $2, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          select
            id,
            startdate,
            enddate,
            postal_code,
            source
          from districts
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            insert into districts values ($1, $2, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          select
            district_id,
            country_id,
            startdate,
            enddate,
            source
          from country_district
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            insert into country_district values ($1, $2, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          select
            district,
            name,
            startdate,
            enddate,
            source
          from district_names
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            insert into district_names values ($1, $2, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          select
            id,
            startdate,
            enddate,
            insee_code_long,
            insee_code_short,
            source
          from cities
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            insert into cities values ($1, $2, $3, $4, $5, $6)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          select
            district_id,
            city_id,
            startdate,
            enddate,
            source
          from city_district
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            insert into city_district values ($1, $2, $3, $4, $5)
          `,
          row,
        )
      }
    }

    {
      const rows = (await connection.execute(
        `
          select
            city,
            name,
            startdate,
            enddate,
            source
          from city_names
        `,
      )).rows
      for (let row of rows) {
        await db.none(
          `
            insert into city_names values ($1, $2, $3, $4, $5)
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
