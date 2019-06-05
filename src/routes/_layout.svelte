<script>
  import { goto, stores } from "@sapper/app"

  import NewIssueModal from "../components/NewIssueModal.svelte"
  import AppNav from "../components/AppNav.svelte"
  import config from "../config"

  const { page, session } = stores()
  export let segment
  let showNewIssueModal = false

  async function logout(/* event */) {
    // eslint-disable-next-line no-undef
    await fetch("auth/logout", {
      credentials: "same-origin",
      method: "POST",
    })
    $session = { ...$session, user: null }
    goto("/")
  }
</script>

<AppNav
  on:logout={logout}
  on:openNewIssueModal={() => (showNewIssueModal = true)}
  {segment} />
<main class="absolute inset-0 pt-12">
  {#if config.globalAlert}
    {@html config.globalAlert.messageHtml}
  {/if}
  <slot />
  {#if showNewIssueModal}
    <NewIssueModal
      on:close={() => (showNewIssueModal = false)} />
  {/if}
</main>
