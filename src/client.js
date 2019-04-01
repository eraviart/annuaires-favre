import { Store } from "svelte/store.js"

import * as sapper from "../__sapper__/client.js"

function post(endpoint, data) {
  // eslint-disable-next-line no-undef
  return fetch(endpoint, {
    body: JSON.stringify(data),
    credentials: "same-origin",
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  }).then(r => r.json())
}

class ConduitStore extends Store {
  login(credentials) {
    return post("auth/login", credentials).then(user => {
      if (!user.errors) this.set({ user })
      return user
    })
  }

  logout() {
    return post("auth/logout").then(user => {
      this.set({ user: null })
      return user
    })
  }

  register(user) {
    return post("auth/register", user).then(user => {
      if (!user.errors) this.set({ user })
      return user
    })
  }

  save(user) {
    return post("auth/save", user).then(user => {
      if (!user.errors) this.set({ user })
      return user
    })
  }
}

// eslint-disable-next-line no-undef
fetch("auth/me", { credentials: "same-origin" })
  .then(response => response.json())
  .then(user => {
    sapper.start({
      store: data => {
        return new ConduitStore({
          ...data,
          user,
        })
      },
      // eslint-disable-next-line no-undef
      target: document.querySelector("#sapper"),
    })
  })
  .catch(error => console.error(error))
