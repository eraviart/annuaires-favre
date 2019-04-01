import passport from "passport"

import { toUserJson } from "../../model/users"

export function post(req, res, next) {
  passport.authenticate("local", function(err, user, info) {
    if (err) {
      return next(err)
    }
    if (!user) {
      res.setHeader("Content-Type", "application/json; charset=utf-8")
      return res.end(JSON.stringify({ errors: info }))
    }
    req.login(user, function(err) {
      if (err) {
        return next(err)
      }
      res.setHeader("Content-Type", "application/json; charset=utf-8")
      return res.end(JSON.stringify(toUserJson(user, { showApiKey: true, showEmail: true })))
    })
  })(req, res, next)
}
