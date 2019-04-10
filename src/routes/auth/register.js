import { db } from "../../database"
import { toUserJson } from "../../model/users"
import {
  validateNonEmptyTrimmedString,
} from "../../validators/core"

export async function post(req, res) {
  let [body, errors] = validateBody(req.body)
  if (errors !== null) {
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    return res.end(JSON.stringify({ errors }, null, 2))
  }

  const { password, username } = body

  errors = {}
  if ((await db.one("SELECT EXISTS (SELECT 1 FROM users WHERE name = $1)", username)).exists) {
    errors["username"] = "An user with the same name already exists."
  }
  if (Object.keys(errors).length > 0) {
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    return res.end(JSON.stringify({ errors }, null, 2))
  }

  const user = {
    name: username,
    password,
  }

  const result = await db.one(
    `INSERT INTO users(name, password)
      VALUES ($<name>, $<password>)
      RETURNING id, is_admin`,
    user
  )
  user.id = result.id
  user.isAdmin = result.is_admin
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  return res.end(JSON.stringify(toUserJson(user), null, 2))
}

function validateBody(body) {
  if (body === null || body === undefined) {
    return [body, "Le formulaire est vide."]
  }
  if (typeof body !== "object") {
    return [body, `Le formulaire devrait être un "object" et non pas un "${typeof body}".`]
  }

  body = {
    ...body,
  }
  const remainingKeys = new Set(Object.keys(body))
  const errors = {}

  for (let key of ["password", "username"]) {
    remainingKeys.delete(key)
    const [value, error] = validateNonEmptyTrimmedString(body[key])
    body[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Unexpected entry"
  }
  return [body, Object.keys(errors).length === 0 ? null : errors]
}
