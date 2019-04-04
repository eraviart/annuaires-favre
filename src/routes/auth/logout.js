import { toUserJson } from "../../model/users"

export function post(req, res) {
  const user = req.user || null
  req.logout()
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  return res.end(JSON.stringify(toUserJson(user), null, 2))
}
