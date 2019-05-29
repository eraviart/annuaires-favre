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
    `,
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
    `Database is too recent for current version of application: ${
      version.number
    } > ${versionNumber}.`,
  )
  if (version.number < versionNumber) {
    console.log(
      `Upgrading database from version ${
        version.number
      } to ${versionNumber}...`,
    )
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
    `,
  )

  // Table: users
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS users(
        id serial NOT NULL PRIMARY KEY,
        is_admin boolean NOT NULL DEFAULT FALSE,
        name text NOT NULL,
        password text NOT NULL
      )
    `,
  )
  await db.none(
    "CREATE UNIQUE INDEX IF NOT EXISTS users_name_idx ON users(name)",
  )

  // Table: corporations
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS corporations(
        id serial NOT NULL PRIMARY KEY,
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000)
      )
    `,
  )
  const { max: corporationsIdMax } = await db.one(
    `
      SELECT max(id) AS max
      FROM corporations
    `,
  )
  if (corporationsIdMax < 20000) {
    await db.none(
      `
        ALTER SEQUENCE corporations_id_seq RESTART WITH 20000
      `,
    )
  }

  // Table: corporation_names
  // This is a merge between DFIH corporation_name & corporation_true_name.
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS corporation_names(
        corporation integer NOT NULL REFERENCES corporations(id),
        name varchar(4000) NOT NULL,
        slug text NOT NULL,
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000),
        comments varchar(4000),
        PRIMARY KEY (corporation, name, startdate, enddate)
      )
    `,
  )
  await db.none(
    `
      CREATE INDEX IF NOT EXISTS corporation_names_slug_idx
        ON corporation_names (slug)
    `,
  )
  await db.none(
    `
      CREATE INDEX IF NOT EXISTS corporation_names_trigrams_idx
        ON corporation_names
        USING GIST (slug gist_trgm_ops)
    `,
  )

  // Table: dummy_corporations
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS dummy_corporations(
        corporation_id integer NOT NULL PRIMARY KEY REFERENCES corporations(id),
        created_at timestamp without time zone NOT NULL,
        page integer NOT NULL,
        user_id integer NOT NULL REFERENCES users(id),
        year integer NOT NULL
      )
    `,
  )

  // Table: countries
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS countries(
        id serial NOT NULL PRIMARY KEY,
        startdate date NOT NULL,
        enddate date NOT NULL,
        iso_code varchar(10),
        source varchar(2000)
      )
    `,
  )

  // Table: country_names
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS country_names(
        country integer NOT NULL REFERENCES countries(id),
        name varchar(250) NOT NULL,
        slug text NOT NULL,
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000),
        PRIMARY KEY (country, name, startdate, enddate)
      )
    `,
  )
  await db.none(
    `
      CREATE INDEX IF NOT EXISTS country_names_slug_idx
        ON country_names (slug)
    `,
  )
  await db.none(
    `
      CREATE INDEX IF NOT EXISTS country_names_trigrams_idx
        ON country_names
        USING GIST (slug gist_trgm_ops)
    `,
  )

  // Table: districts
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS districts(
        id serial NOT NULL PRIMARY KEY,
        startdate date NOT NULL,
        enddate date NOT NULL,
        postal_code varchar(2),
        source varchar(2000)
      )
    `,
  )

  // Table: country_district
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS country_district(
        district_id integer NOT NULL REFERENCES districts(id),
        country_id integer NOT NULL REFERENCES countries(id),
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000)
      )
    `,
  )

  // Table: district_names
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS district_names(
        district integer NOT NULL REFERENCES districts(id),
        name varchar(250) NOT NULL,
        slug text NOT NULL,
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000),
        PRIMARY KEY (district, name, startdate, enddate)
      )
    `,
  )
  await db.none(
    `
      CREATE INDEX IF NOT EXISTS district_names_slug_idx
        ON district_names (slug)
    `,
  )
  await db.none(
    `
      CREATE INDEX IF NOT EXISTS district_names_trigrams_idx
        ON district_names
        USING GIST (slug gist_trgm_ops)
    `,
  )

  // Table: cities
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS cities(
        id serial NOT NULL PRIMARY KEY,
        startdate date NOT NULL,
        enddate date NOT NULL,
        insee_code_long varchar(50),
        insee_code_short varchar(10),
        source varchar(2000)
      )
    `,
  )
  const { max: citiesIdMax } = await db.one(
    `
      SELECT max(id) AS max
      FROM cities
    `,
  )
  if (citiesIdMax < 70000) {
    await db.none(
      `
        ALTER SEQUENCE cities_id_seq RESTART WITH 70000
      `,
    )
  }

  // Table: city_district
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS city_district(
        district_id integer NOT NULL REFERENCES districts(id),
        city_id integer NOT NULL REFERENCES cities(id),
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000)
      )
    `,
  )

  // Table: city_names
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS city_names(
        city integer NOT NULL REFERENCES cities(id),
        name varchar(250) NOT NULL,
        slug text NOT NULL,
        startdate date NOT NULL,
        enddate date NOT NULL,
        source varchar(2000),
        PRIMARY KEY (city, name, startdate, enddate)
      )
    `,
  )
  await db.none(
    `
      CREATE INDEX IF NOT EXISTS city_names_slug_idx
        ON city_names (slug)
    `,
  )
  await db.none(
    `
      CREATE INDEX IF NOT EXISTS city_names_trigrams_idx
        ON city_names
        USING GIST (slug gist_trgm_ops)
    `,
  )

  // Table: dummy_cities
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS dummy_cities(
        city_id integer NOT NULL PRIMARY KEY REFERENCES cities(id),
        created_at timestamp without time zone NOT NULL,
        page integer NOT NULL,
        user_id integer NOT NULL REFERENCES users(id),
        year integer NOT NULL
      )
    `,
  )

  // Table: lines
  await db.none(
    `
      CREATE TABLE IF NOT EXISTS lines(
        id serial NOT NULL PRIMARY KEY,
        city_id integer NOT NULL REFERENCES cities(id),
        city_name text NOT NULL,
        comment text,
        corporation_id integer NOT NULL REFERENCES corporations(id),
        corporation_name text NOT NULL,
        district_id integer NOT NULL REFERENCES districts(id),
        district_name text NOT NULL,
        fair boolean NOT NULL,
        page integer NOT NULL,
        temporary boolean NOT NULL,
        user_id integer NOT NULL REFERENCES users(id),
        year integer NOT NULL,
        created_at timestamp without time zone NOT NULL,
        updated_at timestamp without time zone NOT NULL
      )
    `,
  )

  const previousVersionNumber = version.number

  version.number = versionNumber
  assert(
    version.number >= previousVersionNumber,
    `Error in database upgrade script: Wrong version number: ${
      version.number
    } < ${previousVersionNumber}.`,
  )
  if (version.number !== previousVersionNumber) {
    await db.none("UPDATE version SET number = $1", version.number)
    console.log(
      `Upgraded database from version ${previousVersionNumber} to ${
        version.number
      }.`,
    )
  }
}

configureDatabase()
  .then(() => process.exit(0))
  .catch(error => {
    console.log(error.stack || error)
    process.exit(1)
  })
