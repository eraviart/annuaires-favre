import assert from "assert"
import commandLineArgs from "command-line-args"
import csvParse from "csv-parse"
import fs from "fs"

import { db } from "../database"
import { slugify } from "../strings"

const optionDefinitions = [
  {
    defaultOption: true,
    help: "path of file containing the fake corporations",
    name: "fake_corporations",
    type: String,
  },
]
const options = commandLineArgs(optionDefinitions)

async function main() {
  const csv = fs.readFileSync(options.fake_corporations)
  const records = await new Promise((resolve, reject) => {
    csvParse(
      csv,
      // {
      //   delimiter: ";",
      // },
      function(err, records) {
        if (err) {
          reject(err)
        } else {
          resolve(records)
        }
      },
    )
  })
  /* const header = */ records.shift()

  for (let record of records) {
    assert.strictEqual(record.length, 4, `Unexpected record: ${record}`)
    let [name, id, startdateFrench, enddateFrench] = record
    id = parseInt(id)
    name = name.trim()
    const enddateFrenchSplitted = enddateFrench.split("/")
    const enddate = `${enddateFrenchSplitted[2]}-${enddateFrenchSplitted[1]}-${
      enddateFrenchSplitted[0]
    }`
    const slug = slugify(name)
    const startdateFrenchSplitted = startdateFrench.split("/")
    const startdate = `${startdateFrenchSplitted[2]}-${
      startdateFrenchSplitted[1]
    }-${startdateFrenchSplitted[0]}`
    await db.none(
      `
        INSERT INTO corporations
        VALUES (
          $<id>,
          $<startdate>,
          $<enddate>,
          'Banque fictive pour faciliter la saisie',
          true
        )
        ON CONFLICT
        DO NOTHING
      `,
      {
        id,
        enddate,
        startdate,
      },
    )
    await db.none(
      `
        INSERT INTO corporation_names
        VALUES (
          $<id>,
          $<name>,
          $<slug>,
          $<startdate>,
          $<enddate>,
          'Banque fictive pour faciliter la saisie',
          null
        )
        ON CONFLICT
        DO NOTHING
      `,
      {
        id,
        enddate,
        name,
        slug,
        startdate,
      },
    )
  }
}

main().catch(error => {
  console.log(error.stack || error)
  process.exit(1)
})
