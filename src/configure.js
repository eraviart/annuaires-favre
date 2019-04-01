import assert from "assert"

import { db, versionNumber } from "./database"

async function configureDatabase() {
  // Check that database exists.
  await db.connect()

  // Table: version
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS version(
        number integer NOT NULL
      )
    `
  )
  let version = await db.oneOrNone("SELECT * FROM version")
  if (version === null) {
    await db.none("INSERT INTO version(number) VALUES ($<number>)", {
      number: versionNumber,
    })
    version = await db.one("SELECT * FROM version")
  }
  assert(
    version.number <= versionNumber,
    `Database is too recent for current version of application: ${version.number} > ${versionNumber}.`
  )
  if (version.number < versionNumber) {
    console.log(`Upgrading database from version ${version.number} to ${versionNumber}...`)
  }

  // Table: sessions
  // Cf node_modules/connect-pg-simple/table.sql
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar NOT NULL COLLATE "default" PRIMARY KEY NOT DEFERRABLE INITIALLY IMMEDIATE,
        sess json NOT NULL,
        expire timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `
  )

  // Table: users
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS users(
        activated boolean NOT NULL DEFAULT FALSE,
        api_key text UNIQUE NOT NULL,
        email text UNIQUE NOT NULL,
        id bigserial NOT NULL PRIMARY KEY,
        is_admin boolean NOT NULL DEFAULT FALSE,
        name text NOT NULL,
        password_digest text NOT NULL,
        salt text NOT NULL,
        slug text UNIQUE NOT NULL
      )
    `
  )
  await db.none("CREATE UNIQUE INDEX IF NOT EXISTS users_api_key_idx ON users(api_key)")
  await db.none("CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email)")
  await db.none("CREATE UNIQUE INDEX IF NOT EXISTS users_slug_idx ON users(slug)")

  // Table: countries
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS countries(
        id bigserial NOT NULL PRIMARY KEY,
        startdate date NOT NULL,
        enddate date NOT NULL,
        iso_code varchar(10),
        source varchar(2000)
      )
    `
  )

  // Table: country_names
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS country_names(
        country bigint NOT NULL REFERENCES countries(id),
        name varchar(250),
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000),
        PRIMARY KEY (country, name, startdate, enddate)
      )
    `
  )

  // Table: districts
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS districts(
        id bigserial NOT NULL PRIMARY KEY,
        startdate date NOT NULL,
        enddate date NOT NULL,
        postal_code varchar(2),
        source varchar(2000)
      )
    `
  )

  // Table: country_district
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS country_district(
        district_id bigint NOT NULL REFERENCES districts(id),
        country_id bigint NOT NULL REFERENCES countries(id),
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000)
      )
    `
  )

  // Table: district_names
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS district_names(
        district bigint NOT NULL REFERENCES districts(id),
        name varchar(250),
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000),
        PRIMARY KEY (district, name, startdate, enddate)
      )
    `
  )

  // Table: cities
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS cities(
        id bigserial NOT NULL PRIMARY KEY,
        startdate date NOT NULL,
        enddate date NOT NULL,
        insee_code_long varchar(50),
        insee_code_short varchar(10),
        source varchar(2000)
      )
    `
  )

  // Table: city_district
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS city_district(
        district_id bigint NOT NULL REFERENCES districts(id),
        city_id bigint NOT NULL REFERENCES cities(id),
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000)
      )
    `
  )

  // Table: city_names
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS city_names(
        city bigint NOT NULL REFERENCES cities(id),
        name varchar(250),
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000),
        PRIMARY KEY (city, name, startdate, enddate)
      )
    `
  )

  const previousVersionNumber = version.number

  version.number = versionNumber
  assert(
    version.number >= previousVersionNumber,
    `Error in database upgrade script: Wrong version number: ${version.number} < ${previousVersionNumber}.`
  )
  if (version.number !== previousVersionNumber) {
    await db.none("UPDATE version SET number = $1", version.number)
    console.log(`Upgraded database from version ${previousVersionNumber} to ${version.number}.`)
  }
}

configureDatabase()
  .then(() => process.exit(0))
  .catch(error => {
    console.log(error.stack || error)
    process.exit(1)
  })
