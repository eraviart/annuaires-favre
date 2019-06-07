import {
  validateChain,
  validateInteger,
  validateNonEmptyTrimmedString,
  validateTest,
  validateUrl,
} from "./core"

function validateDb(db) {
  if (db === null || db === undefined) {
    return [db, "Valeur manquante"]
  }
  if (typeof db !== "object") {
    return [db, `Expected an object got "${typeof db}"`]
  }

  db = { ...db }
  const errors = {}
  const remainingKeys = new Set(Object.keys(db))

  for (let key of ["database", "host", "password", "user"]) {
    remainingKeys.delete(key)
    const [value, error] = validateNonEmptyTrimmedString(db[key])
    db[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "port"
    remainingKeys.delete(key)
    const [value, error] = validateChain([
      validateInteger,
      validateTest(
        value => 0 <= value && value <= 65536,
        "Must be an integer between 0 and 65536",
      ),
    ])(db[key])
    db[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Unexpected item"
  }
  return [db, Object.keys(errors).length === 0 ? null : errors]
}

function validateGitLab(gitlab) {
  if (gitlab === null || gitlab === undefined) {
    return [gitlab, "Valeur manquante"]
  }
  if (typeof gitlab !== "object") {
    return [gitlab, `Expected an object got "${typeof gitlab}"`]
  }

  gitlab = { ...gitlab }
  const errors = {}
  const remainingKeys = new Set(Object.keys(gitlab))

  for (let key of ["accessToken", "projectPath"]) {
    remainingKeys.delete(key)
    const [value, error] = validateNonEmptyTrimmedString(gitlab[key])
    gitlab[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "url"
    remainingKeys.delete(key)
    const [value, error] = validateUrl(gitlab[key])
    gitlab[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Unexpected item"
  }
  return [gitlab, Object.keys(errors).length === 0 ? null : errors]
}

export function validateServerConfig(config) {
  if (config === null || config === undefined) {
    return [config, "Missing config"]
  }
  if (typeof config !== "object") {
    return [config, `Expected an object got "${typeof config}"`]
  }

  config = { ...config }
  const errors = {}
  const remainingKeys = new Set(Object.keys(config))

  {
    const key = "db"
    remainingKeys.delete(key)
    const [value, error] = validateDb(config[key])
    config[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "gitlab"
    remainingKeys.delete(key)
    const [value, error] = validateGitLab(config[key])
    config[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "sessionSecret"
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
