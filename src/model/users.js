export function entryToUser(entry) {
  return entry === null
    ? null
    : {
        activated: entry.activated,
        apiKey: entry.api_key,
        email: entry.email,
        id: parseInt(entry.id),
        isAdmin: entry.is_admin,
        name: entry.name,
        passwordDigest: entry.password_digest,
        salt: entry.salt,
        slug: entry.slug,
      }
}

export function toUserJson(user, { showApiKey = false, showEmail = false } = {}) {
  if (user === null) {
    return null
  }
  let userJson = { ...user }
  if (!showApiKey) delete userJson.apiKey
  if (!showEmail) delete userJson.email
  // userJson.createdAt = userJson.createdAt.toISOString()
  // delete userJson.id
  delete userJson.passwordDigest
  delete userJson.salt
  return userJson
}
