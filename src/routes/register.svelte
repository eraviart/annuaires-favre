<script>
  import { goto, stores } from "@sapper/app"

  import ListErrors from "../components/ListErrors.svelte"
  import config from "../config"

  let errors = null
  let password = ""
  let user = null
  let username = ""
  const { session } = stores()

  async function submit() {
    // eslint-disable-next-line no-undef
    const response = await fetch("auth/register", {
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
  <title>Inscription | {config.title}</title>
</svelte:head>

<div class="auth-page">
  <div class="container page">
    <div class="row">

      <div class="col-md-6 offset-md-3 col-xs-12">
        <h1 class="text-2xl text-xs-center">Sign up</h1>
        <p class="text-xs-center">
          <a class="text-blue-500 underline" href="/login">Have an account?</a>
        </p>

        <ListErrors {errors} />

        <form on:submit|preventDefault={submit}>
          <fieldset class="form-group">
            <input
              class="form-control form-control-lg"
              name="username"
              type="text"
              placeholder="Your Name"
              bind:value={username} />
          </fieldset>
          <fieldset class="form-group">
            <input
              class="form-control form-control-lg"
              name="password"
              type="password"
              placeholder="Password"
              bind:value={password} />
          </fieldset>
          <button class="btn btn-lg btn-primary pull-xs-right">Sign up</button>
        </form>
      </div>

    </div>
  </div>
</div>
