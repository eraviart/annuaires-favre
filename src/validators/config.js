import {
  validateArray,
  validateBoolean,
  validateChoice,
  validateMaybeTrimmedString,
  validateMissing,
  validateNonEmptyTrimmedString,
  validateOption,
  validateSetValue,
  validateUrl,
} from "./core"

function validateAlert(alert) {
  if (alert === null || alert === undefined) {
    return [alert, "Missing value"]
  }
  if (typeof alert !== "object") {
    return [alert, `Expected an object got "${typeof alert}"`]
  }

  alert = { ...alert }
  const errors = {}
  const remainingKeys = new Set(Object.keys(alert))

  for (let key of ["class", "messageHtml"]) {
    remainingKeys.delete(key)
    const [value, error] = validateNonEmptyTrimmedString(alert[key])
    alert[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Unexpected item"
  }
  return [alert, Object.keys(errors).length === 0 ? null : errors]
}

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

  {
    const key = "globalAlert"
    remainingKeys.delete(key)
    const [value, error] = validateOption([validateMissing, validateAlert])(
      config[key],
    )
    config[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of ["leftMenu", "rightMenu"]) {
    remainingKeys.delete(key)
    const [value, error] = validateArray(validateMenuItem)(config[key])
    config[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

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

function validateMenuItem(page) {
  if (page === null || page === undefined) {
    return [page, "Missing value"]
  }
  if (typeof page !== "object") {
    return [page, `Expected an object got "${typeof page}"`]
  }

  page = { ...page }
  const errors = {}
  const remainingKeys = new Set(Object.keys(page))

  for (let key of ["contentHtml", "url"]) {
    remainingKeys.delete(key)
    const [value, error] = validateNonEmptyTrimmedString(page[key])
    page[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "prefetch"
    remainingKeys.delete(key)
    const [value, error] = validateOption([
      [validateMissing, validateSetValue(false)],
      validateBoolean,
    ])(page[key])
    page[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  {
    const key = "title"
    remainingKeys.delete(key)
    const [value, error] = validateMaybeTrimmedString(page[key])
    page[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Unexpected item"
  }
  return [page, Object.keys(errors).length === 0 ? null : errors]
}
