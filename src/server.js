import bodyParser from "body-parser"
import compression from "compression"
import PgSession from "connect-pg-simple"
import { pbkdf2Sync } from "crypto"
import session from "express-session"
import passport from "passport"
import { Strategy as LocalStrategy } from "passport-local"
import polka from "polka"
import sirv from "sirv"
import { Store } from "svelte/store.js"

import * as sapper from "../__sapper__/server.js"
import { checkDatabase, db } from "./database"
import "./global.css"
import { entryToUser } from "./model/users"
import serverConfig from "./server-config"
import { slugify } from "./strings"

const { PORT, NODE_ENV } = process.env
const dev = NODE_ENV === "development"
const PgSessionStore = PgSession(session)

passport.deserializeUser(async function(userId, done) {
  const user = entryToUser(
    await db.oneOrNone(
      `
        SELECT * FROM users
        WHERE id = $1
      `,
      userId
    )
  )
  done(null, user)
})

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async function(username, password, done) {
      let user
      if (username.indexOf("@") >= 0) {
        user = entryToUser(
          await db.oneOrNone(
            `
              SELECT * FROM users
              WHERE email = $1
            `,
            username
          )
        )
        if (user === null) {
          return done(null, false, { username: `No user with email "${username}".` })
        }
      } else {
        let slug = slugify(username)
        user = entryToUser(
          await db.oneOrNone(
            `
              SELECT * FROM users
              WHERE slug = $1
            `,
            slug
          )
        )
        if (user === null) {
          return done(null, false, { username: `No user with name "${slug}".` })
        }
      }
      let passwordDigest = pbkdf2Sync(password, user.salt, 4096, 16, "sha512")
        .toString("base64")
        .replace(/=/g, "")
      if (passwordDigest != user.passwordDigest) {
        return done(null, false, { password: `Invalid password for user "${username}".` })
      }

      return done(null, user)
    }
  )
)

checkDatabase()
  .then(() => {
    polka()
      .use(
        compression({ threshold: 0 }),
        sirv("static", { dev }),
        session({
          // cookie: {
          //   maxAge: 31536000
          // },
          resave: false,
          saveUninitialized: false,
          secret: serverConfig.sessionSecret,
          store: new PgSessionStore({
            pgPromise: db,
            tableName: "sessions",
          }),
        }),
        bodyParser.json({
          limit: "1mb",
        }),
        // bodyParser.urlencoded({ extended: false, type: "application/x-www-form-urlencoded" }),
        passport.initialize(),
        passport.session(),
        sapper.middleware({
          store: req => {
            return new Store({
              user: req.user,
            })
          },
        })
      )
      .listen(PORT, error => {
        if (error) {
          console.log(`Error when calling listen on port ${PORT}:`, error)
        }
      })
  })
  .catch(error => {
    console.log(error.stack || error)
    process.exit(1)
  })
