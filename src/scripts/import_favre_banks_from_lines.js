import assert from "assert"
import commandLineArgs from "command-line-args"
import csvParse from "csv-parse"
import fs from "fs"

import { db } from "../database"
import { slugify } from "../strings"
import { assertValid } from "../validators/assert"
import {
  validateChain,
  validateFunction,
  validateNonEmptyTrimmedString,
  validateStringToNumber,
  validateTest,
  validateTrimmedString,
  validateTuple,
} from "../validators/core"

const optionDefinitions = [
  {
    defaultOption: true,
    help: "path of file containing the Favre lines" ,
    name: "lines",
    type: String,
  },
]
const options = commandLineArgs(optionDefinitions)

async function main() {
  const csv = fs.readFileSync(options.lines)
  const records = await new Promise((resolve, reject) => {
    csvParse(
      csv,
      // {
      //   delimiter: ";",
      // },
      function (err, records) {
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
    assert.strictEqual(record.length, 12, `Unexpected record: ${record}`)
    let [
      startDate,
      endDate,
      districtName,
      districtId,
      cityName,
      cityId,
      bankName,
      bankId,
      temporary,
      fair,
    ] = assertValid(validateChain([
      validateTuple([
        validateFrenchDateToIsoDate,  // startdate
        validateFrenchDateToIsoDate,  // enddate
        validateNonEmptyTrimmedString,  // Département
        validateStringToNumber,  // Département ID
        validateNonEmptyTrimmedString,  // Localité
        validateStringToNumber,  // Localité ID
        validateNonEmptyTrimmedString,  // Banque
        validateStringToNumber,  // Banque ID
        validateStringToBoolean,  // Guichet temporaire
        validateStringToBoolean,  // Jours de foire
        validateNonEmptyTrimmedString,  // computed
        validateStringToNumber,  // Localité ID 2
      ]),
      validateTest(
        record => record[5] === record[11],
        record => `City IDs are not equal: ${record[5]} ≠ ${record[11]} in ${record}`,
      ),
    ])(record)).slice(0, 10)
    const entry = {
      bankId,
      bankName,
      cityId,
      cityName,
      districtId,
      districtName,
      endDate,
      fair,
      startDate,
      temporary,
    }

    if (!(await db.one(
      `
        SELECT EXISTS(
          SELECT *
          FROM corporation_names
          WHERE
            corporation = $<bankId>
            AND name = $<bankName>
        )
      `,
      entry,
    )).exists) {
      if ((await db.one(
        `
          SELECT EXISTS(
            SELECT *
            FROM corporations
            WHERE
              id = $<bankId>
          )
        `,
        entry,
      )).exists) {
        console.log(`Adding name ${bankName} to bank ${bankId}…`)
      } else {
        console.log(`Creating bank ${bankId} with name ${bankName}…`)
        await db.none(
          `
            INSERT INTO corporations
            VALUES (
              $<bankId>,
              $<startDate>,
              $<endDate>,
              'Annuaire Favre'
            )
          `,
          entry,
        )
      }
      await db.none(
        `
          INSERT INTO corporation_names
          VALUES (
            $<bankId>,
            $<bankName>,
            $<slug>,
            $<startDate>,
            $<endDate>,
            'Annuaire Favre',
            null
          )
        `,
        {
          ...entry,
          slug: slugify(bankName),
        },
      )
    }
  }
}

function validateFrenchDate(input) {
  const [value, error] = validateNonEmptyTrimmedString(input)
  if (error !== null) {
    return [value, error]
  }
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
    return [value, "Invalid french date"]
  }
  return [value, null]
}

function validateFrenchDateToIsoDate(input) {
  return validateChain([
    validateFrenchDate,
    validateFunction(frenchDate => {
      const dateSplitted = frenchDate.split("/")
      return `${dateSplitted[2]}-${dateSplitted[1]}-${dateSplitted[0]}`
    }),
  ])(input)
}

function validateStringToBoolean(input) {
  const [value, error] = validateTrimmedString(input)
  if (error !== null) {
    return [value, error]
  }
  switch (value) {
    case "":
    case "non":
      return [0, null]
    case "oui":
      return [1, null]
    default:
      return [value, `Invalid boolean text: ${value}`]
  }
}

main()
  .catch(error => {
    console.log(error.stack || error)
    process.exit(1)
  })
