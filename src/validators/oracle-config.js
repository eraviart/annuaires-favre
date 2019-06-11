import { validateNonEmptyTrimmedString } from "./core"

export function validateOracleConfig(database) {
  if (database === null || database === undefined) {
    return [database, "Missing value"]
  }
  if (typeof database !== "object") {
    return [database, `Expected an object got "${typeof database}"`]
  }

  database = { ...database }
  const errors = {}
  const remainingKeys = new Set(Object.keys(database))

  for (let key of ["connectString", "password", "user"]) {
    if (remainingKeys.delete(key)) {
      const [value, error] = validateNonEmptyTrimmedString(database[key])
      database[key] = value
      if (error !== null) {
        errors[key] = error
      }
    } else {
      errors[key] = "Missing item"
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Unexpected item"
  }
  return [database, Object.keys(errors).length === 0 ? null : errors]
}
