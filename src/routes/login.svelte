<script>
  import { goto, stores } from "@sapper/app"

  import ListErrors from "../components/ListErrors.svelte"
  import config from "../config"

  let errors = null
  let password = ""
  let user = null
  let username = ""
  const { session } = stores()

  $: canSubmit = username && password

  async function submit() {
    // eslint-disable-next-line no-undef
    const response = await fetch("auth/login", {
      body: JSON.stringify({ password, username }),
      credentials: "same-origin",
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
    user = await response.json()
    if (user.errors) {
      errors = user.errors
      user = null
    } else {
      errors = null
    }
    $session = { ...$session, user }
    if (errors === null) {
      goto("/")
    }
  }
</script>

<svelte:head>
  <title>Authentification | {config.title}</title>
</svelte:head>

<div class="mx-auto px-2 w-full md:w-1/2 lg:w-1/3">
  <h1 class="text-2xl text-center">Identification</h1>

  <ListErrors {errors} />

  <form class="mt-4" on:submit|preventDefault={submit}>
    <input
      class="appearance-none border leading-tight my-2 focus:outline-none px-3
      py-2 rounded shadow focus:shadow-outline w-full"
      name="username"
      placeholder="Nom"
      required
      type="text"
      bind:value={username} />
    <input
      class="appearance-none border leading-tight my-2 focus:outline-none px-3
      py-2 rounded shadow focus:shadow-outline w-full"
      name="password"
      placeholder="Mot de passe"
      required
      type="password"
      bind:value={password} />
    <div class="flex items-baseline justify-between mt-6">
      <a class="link" href="/register">Créer un nouveau compte</a>
      <button
        class="{canSubmit ? "bg-gray-600 hover:bg-gray-800" : "bg-gray-400"} font-bold px-4 py-2 rounded
        text-gray-100"
        disabled={!canSubmit}
        type="submit">
        M'identifier
      </button>
    </div>
  </form>
</div>
