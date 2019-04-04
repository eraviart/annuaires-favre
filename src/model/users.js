export function entryToUser(entry) {
  return entry === null
    ? null
    : {
        id: parseInt(entry.id),
        isAdmin: entry.is_admin,
        name: entry.name,
        password: entry.password,
      }
}

export function toUserJson(user) {
  if (user === null) {
    return null
  }
  let userJson = { ...user }
  delete userJson.password
  return userJson
}
