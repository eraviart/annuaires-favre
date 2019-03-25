import bodyParser from "body-parser"
import compression from "compression"
import { pbkdf2Sync } from "crypto"
import session from "express-session"
import polka from "polka"
import sirv from "sirv"
import { Store } from "svelte/store.js"

import * as sapper from "../__sapper__/server.js"
import "./global.css"
import serverConfig from "./server-config"

const { PORT, NODE_ENV } = process.env
const dev = NODE_ENV === "development"

polka() // You can also use Express
  .use(
    session({
      secret: serverConfig.sessionSecret,
      resave: false,
      saveUninitialized: false,
      // cookie: {
      //   maxAge: 31536000
      // },
    })
  )
  .use(bodyParser.json({
    limit: "1mb",
  }))
  // .use(bodyParser.urlencoded({ extended: false, type: "application/x-www-form-urlencoded" }))
  .use(
    compression({ threshold: 0 }),
    sirv("static", { dev }),
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
