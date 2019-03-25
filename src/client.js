import { Store } from "svelte/store.js"

import * as sapper from "../__sapper__/client.js"

sapper.start({
  store: data => {
    return new Store({
      ...data,
    })
  },
  // eslint-disable-next-line no-undef
  target: document.querySelector("#sapper"),
})
