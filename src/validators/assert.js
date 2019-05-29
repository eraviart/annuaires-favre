import assert from "assert"

export function assertValid([value, error]) {
  assert(
    error === null,
    `Error ${JSON.stringify(error, null, 2)} for ${JSON.stringify(
      value,
      null,
      2,
    )}`,
  )
  return value
}
