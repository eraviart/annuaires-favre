import { pbkdf2Sync, randomBytes } from "crypto"

import { db } from "../../database"
import { toUserJson } from "../../model/users"
import { slugify } from "../../strings"

export async function post(req, res) {
  const { email, password, username } = req.body
  const errors = {}

  if ((await db.one("SELECT EXISTS (SELECT 1 FROM users WHERE email = $1)", email)).exists) {
    errors["email"] = "An user with the same email address already exists."
  }
  const slug = slugify(username)
  if (!slug) {
    errors["username"] = "Username must contain at least one alphanumerical character."
  } else if ((await db.one("SELECT EXISTS (SELECT 1 FROM users WHERE slug = $1)", slug)).exists) {
    errors["username"] = "An user with the same name already exists."
  }

  if (Object.keys(errors).length > 0) {
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    return res.end(JSON.stringify({ errors }, null, 2))
  }

  const user = {
    apiKey: null,
    email,
    name: username,
    passwordDigest: null,
    salt: null,
    slug,
  }

  if (password) {
    user.apiKey = randomBytes(16)
      .toString("base64")
      .replace(/=/g, "") // 128 bits API key
    // See http://security.stackexchange.com/a/27971 for explaination of digest and salt size.
    user.salt = randomBytes(16)
      .toString("base64")
      .replace(/=/g, "")
    user.passwordDigest = pbkdf2Sync(password, user.salt, 4096, 16, "sha512")
      .toString("base64")
      .replace(/=/g, "")
  }

  const result = await db.one(
    `INSERT INTO users(api_key, email, name, password_digest, salt, slug)
      VALUES ($<apiKey>, $<email>, $<name>, $<passwordDigest>, $<salt>, $<slug>)
      RETURNING activated, id, is_admin`,
    user
  )
  user.activated = result.activated
  user.id = result.id
  user.isAdmin = result.is_admin
  // TODO: Convert user to JSON and remove secret attributes.
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  return res.end(JSON.stringify(toUserJson(user, { showApiKey: true, showEmail: true }), null, 2))
}
