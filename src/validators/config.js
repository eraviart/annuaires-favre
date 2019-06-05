import {
  validateNonEmptyTrimmedString,
} from "./core"

export function validateConfig(config) {
  if (config === null || config === undefined) {
    return [config, "Missing config"]
  }
  if (typeof config !== "object") {
    return [config, `Expected an object got "${typeof config}"`]
  }

  config = { ...config }
  const errors = {}
  const remainingKeys = new Set(Object.keys(config))

  for (let key of ["missionStatement", "title", "url"]) {
    remainingKeys.delete(key)
    const [value, error] = validateNonEmptyTrimmedString(config[key])
    config[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Unexpected item"
  }
  return [config, Object.keys(errors).length === 0 ? null : errors]
}
