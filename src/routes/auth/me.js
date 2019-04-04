import { toUserJson } from "../../model/users"

export async function get(req, res) {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  })
  res.end(JSON.stringify(toUserJson(req.user || null), null, 2))
}
