import assert from "assert"
import commandLineArgs from "command-line-args"
import csvParse from "csv-parse"
import fs from "fs"

import { db } from "../database"
import { slugify } from "../strings"
import { assertValid } from "../validators/assert"
import {
  validateChain,
  validateEmpty,
  validateNonEmptyTrimmedString,
  validateStringToNumber,
  validateTest,
  validateTuple,
} from "../validators/core"

const optionDefinitions = [
  {
    defaultOption: true,
    help: "path of file containing the Favre cities",
    name: "cities",
    type: String,
  },
]
const options = commandLineArgs(optionDefinitions)

async function main() {
  const csv = fs.readFileSync(options.cities)
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
    assert.strictEqual(record.length, 11, `Unexpected record: ${record}`)
    let [favreDistrictName, favreCityName, districtId, cityId] = assertValid(
      validateChain([
        validateTuple([
          validateNonEmptyTrimmedString, // DISTRICT_FAVRE
          validateNonEmptyTrimmedString, // CITY_FAVRE
          validateStringToNumber, // DISTRICT_ID_DFIH
          validateStringToNumber, // CITY_ID_DFIH
          validateEmpty,
          validateEmpty,
          validateEmpty,
          validateEmpty,
          validateEmpty,
          validateNonEmptyTrimmedString, // computed
          validateStringToNumber, // CITY_ID_DFIH
        ]),
        validateTest(
          record => record[3] === record[10],
          record =>
            `City IDs are not equal: ${record[3]} ≠ ${record[10]} in ${record}`,
        ),
      ])(record),
    ).slice(0, 4)

    if (
      !(await db.one(
        `
        SELECT EXISTS(
          SELECT *
          FROM district_names
          WHERE
            district = $<id>
            AND name = $<name>
        )
      `,
        {
          id: districtId,
          name: favreDistrictName,
        },
      )).exists
    ) {
      console.log(`Adding name ${favreDistrictName} to district ${districtId}…`)
      await db.none(
        `
          INSERT INTO district_names
          VALUES (
            $<id>,
            $<name>,
            $<slug>,
            '1000-01-01',
            '3999-12-30',
            'Annuaire Favre'
          )
        `,
        {
          id: districtId,
          name: favreDistrictName,
          slug: slugify(favreDistrictName),
        },
      )
    }

    if (
      !(await db.one(
        `
        SELECT EXISTS(
          SELECT *
          FROM city_names
          WHERE
            city = $<id>
            AND name = $<name>
        )
      `,
        {
          id: cityId,
          name: favreCityName,
        },
      )).exists
    ) {
      console.log(`Adding name ${favreCityName} to city ${cityId}…`)
      await db.none(
        `
          INSERT INTO city_names
          VALUES (
            $<id>,
            $<name>,
            $<slug>,
            '1000-01-01',
            '3999-12-30',
            'Annuaire Favre'
          )
        `,
        {
          id: cityId,
          name: favreCityName,
          slug: slugify(favreCityName),
        },
      )
    }
  }
}

main().catch(error => {
  console.log(error.stack || error)
  process.exit(1)
})
