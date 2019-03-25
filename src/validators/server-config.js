import {
  validateChain,
  validateInteger,
  validateNonEmptyTrimmedString,
  validateTest,
  validateUrl,
} from "./core"

function validateGitLab(gitlab) {
  if (gitlab === null || gitlab === undefined) {
    return [gitlab, "Missing value"]
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
