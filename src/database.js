import assert from "assert"
import pgPromiseFactory from "pg-promise"

import serverConfig from "./server-config"

const pgPromise = pgPromiseFactory()
export const db = pgPromise({
  database: serverConfig.db.database,
  host: serverConfig.db.host,
  password: serverConfig.db.password,
  port: serverConfig.db.port,
  user: serverConfig.db.user,
})
export let dbSharedConnectionObject = null

export const versionNumber = 0

export async function checkDatabase() {
  // Check that database exists.
  dbSharedConnectionObject = await db.connect()

  assert(
    await existsTable("version"),
    'Database is not initialized. Run "npm run configure" to configure it.',
  )

  let version = await db.one("SELECT * FROM version")
  assert(
    version.number <= versionNumber,
    'Database format is too recent. Upgrade "Annuaires Favre" software.',
  )
  assert.strictEqual(
    version.number,
    versionNumber,
    'Database must be upgraded. Run "npm run configure" to configure it.',
  )
}

async function existsTable(tableName) {
  return (await db.one(
    "SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_name=$1)",
    [tableName],
  )).exists
}
