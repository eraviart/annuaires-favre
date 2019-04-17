import assert from "assert"

// Cf https://stackoverflow.com/questions/1303872/trying-to-validate-url-using-javascript
// But added support for "localhost"
const urlRegExp = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)|localhost(?::\d{2,5})?(?:[/?#]\S*)?$/i

export function validateArray(itemValidator) {
  return function(array) {
    if (array === null || array === undefined) {
      return [array, "Missing value"]
    }
    if (!Array.isArray(array)) {
      return [array, `Expected an array, got "${typeof array}"`]
    }

    if (itemValidator === null || itemValidator === undefined) {
      return [array, null]
    }

    const errors = {}
    array = [...array]
    for (let [index, value] of array.entries()) {
      const [validatedValue, error] = itemValidator(value)
      array[index] = validatedValue
      if (error !== null) {
        errors[index] = error
      }
    }
    return [array, Object.keys(errors).length === 0 ? null : errors]
  }
}

export function validateBoolean(value) {
  if (value === null || value === undefined) {
    return [value, "Missing value"]
  }
  if (typeof value !== "boolean") {
    return [value, `Expected a boolean, got "${typeof value}"`]
  }
  return [value, null]
}

export function validateChain(validators) {
  return function(value) {
    let error = null
    for (let validator of validators) {
      [value, error] = validator(value)
      if (error !== null) {
        return [value, error]
      }
    }
    return [value, null]
  }
}

export function validateChoice(options) {
  return function (value) {
    if (!options.includes(value)) {
      return [value, "Unexpected option"]
    }
    return [value, null]
  }
}

export function validateEmpty(value) {
  return validateChain([validateEmptyToNull, validateMissing])(value)
}

export function validateEmptyToNull(value) {
  if (value === null || value === undefined) {
    return [null, null]
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [null, null]
    }
  } else if (typeof value === "object") {
    if (Object.keys(value).length === 0) {
      return [null, null]
    }
  } else if (typeof value === "string") {
    if (!value.trim()) {
      return [null, null]
    }
  }
  return [value, null]
}

export function validateFunction(func) {
  return function(value) {
    return [func(value), null]
  }
}

export function validateInteger(value) {
  if (value === null || value === undefined) {
    return [value, "Missing value"]
  }
  if (!Number.isInteger(value)) {
    return [value, `Expected an integer, got "${typeof value}"`]
  }
  return [value, null]
}

export function validateMaybeTrimmedString(value) {
  return validateOption([
      validateMissing,
      [validateString, validateFunction(value => value.trim()), validateEmptyToNull],
    ])(value)
}

export function validateMissing(value) {
  if (value === null || value === undefined) {
    return [null, null]
  }
  return [value, "Expected null or undefined"]
}

export function validateNonEmpty(value) {
  if (value === null || value === undefined) {
    return [value, "Missing value"]
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [value, "Expected a non empty array"]
    }
  } else if (typeof value === "object") {
    if (Object.keys(value).length === 0) {
      return [value, "Expected a non empty object"]
    }
  } else if (typeof value === "string") {
    if (!value) {
      return [value, "Expected a non empty string"]
    }
  }
  return [value, null]
}

export function validateNonEmptyTrimmedString(value) {
  return validateChain([
    validateString,
    validateFunction(value => value.trim()),
    validateNonEmpty,
  ])(value)
}

export function validateStringToNumber(value) {
  if (value === null || value === undefined) {
    return [value, "Missing value"]
  }
  const number = Number(value)
  if (isNaN(number)) {
    return [value, "Not a number"]
  }
  return [number, null]
}

export function validateOption(branches) {
  assert(Array.isArray(branches))
  assert(branches.length > 0)
  return function(value) {
    const errors = []
    let error = null
    const initialValue = value
    for (let branch of branches) {
      value = initialValue
      const validators = Array.isArray(branch) ? branch : [branch]
      {
        [value, error] = validators[0](value)
      }
      if (error !== null) {
        errors.push(error)
        continue
      }
      for (let validator of validators.slice(1)) {
        [value, error] = validator(value)
        if (error !== null) {
          return [value, error]
        }
      }
      break
    }
    if (error !== null) {
      return [initialValue, errors]
    }
    return [value, null]
  }
}

export function validateSetValue(constant) {
  // eslint-disable-next-line no-unused-vars
  return function(value) {
    return [constant, null]
  }
}

export function validateStrictEqual(expected) {
  return function (value) {
    if (value !== expected) {
      return [value, `Expected a value equal to "${expected}"`]
    }
    return [value, null]
  }
}

export function validateString(value) {
  if (value === null || value === undefined) {
    return [value, "Missing value"]
  }
  if (typeof value !== "string") {
    return [value, `Expected a string, got "${typeof value}"`]
  }
  return [value, null]
}

export function validateTest(test, errorMessage) {
  return function(value) {
    return [
      value,
      test(value)
        ? null
        : !errorMessage
          ? "Test failed"
          : typeof errorMessage === "string"
            ? errorMessage
            : errorMessage(value),
    ]
  }
}

export function validateTuple(tupleValidator) {
  assert(Array.isArray(tupleValidator))

  return function(array) {
    if (array === null || array === undefined) {
      return [array, "Missing value"]
    }
    if (!Array.isArray(array)) {
      return [array, `Expected an array, got "${typeof array}"`]
    }
    if(array.length !== tupleValidator.length) {
      return [array, `Expected an array of length ${tupleValidator.length}, got "${array.length}"`]

    }

    const errors = {}
    array = array
      .map((value, index) => {
        const [validatedValue, error] = tupleValidator[index](value)
        if (error !== null) {
          errors[index] = error
        }
        return validatedValue
      })
    return [array, Object.keys(errors).length === 0 ? null : errors]
  }
}

export function validateUrl(input) {
  const [value, error] = validateNonEmptyTrimmedString(input)
  if (error !== null) {
    return [value, error]
  }
  if (!urlRegExp.test(value)) {
    return [value, "Invalid URL"]
  }
  // Wikibase-specific tests
  if (value.length > 500) {
    return [value, "URL too long for Wikibase"]
  }
  if (/[ \[\]]/.test(value)) {
    return [value, "An URL can not contain spaces or square brackets"]
  }
  return [value, null]
}
