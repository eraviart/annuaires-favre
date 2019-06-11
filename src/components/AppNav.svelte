<script>
  import { faBars } from "@fortawesome/free-solid-svg-icons/faBars"
  import { faChevronDown } from "@fortawesome/free-solid-svg-icons/faChevronDown"
  import { faSignInAlt } from "@fortawesome/free-solid-svg-icons/faSignInAlt"
  import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons/faSignOutAlt"
  import { faUser } from "@fortawesome/free-solid-svg-icons/faUser"
  import Icon from "fa-svelte"
  import { createEventDispatcher } from "svelte"

  import { stores } from "@sapper/app"
  import config from "../config"

  const dispatch = createEventDispatcher()
  const leftMenu = [
    {
      contentHtml: "Home",
      prefetch: true,
      title: "Landing page",
      url: ".",
    },
  ]
  const rightMenu = [
    {
      contentHtml: "About",
      // prefetch: true,
      title: "Informations on this web site",
      url: "https://dfih.fr/about",
    },
  ]
  export let segment
  const { session } = stores()
  let showMainMenu = false
  let showUserMenu = false

  function logout() {
    showUserMenu = false
    dispatch("logout")
  }
</script>

<nav
  aria-label="main navigation"
  class="fixed flex items-top justify-between flex-wrap bg-gray-700 px-2
  text-gray-100 w-full z-10"
  role="navigation">
  <div class="flex flex-col flex-grow items-baseline my-1 md:flex-row">
    <div class="flex items-baseline flex-shrink-0 mr-6 my-2">
      <a
        class="font-medium italic text-xl tracking-tight"
        href={config.url}
        on:click={() => (showMainMenu = false)}
        rel="prefetch"
        title={config.missionStatement}>
        <img
          alt=""
          class="inline"
          height="16"
          src="/dfih-logo-150x74.png"
          width="32" />
         {config.title}
      </a>
    </div>
    <div
      class="{showMainMenu ? 'block' : 'hidden'} flex-grow w-full md:flex
      md:items-center md:w-auto">
      <div class="flex flex-col md:flex-grow md:flex-row">
        {#each leftMenu as menuItem}
          <span class="inline-flex">
            <a
              class="block border-b-2 {(segment || '.') === menuItem.url ? 'border-gray-100' : 'border-gray-800'}
              flex-none mr-4 mt-4 md:mt-0 pb-2 hover:border-gray-400
              hover:text-gray-400"
              class:app-nav-link-current={(segment || '.') === menuItem.url}
              on:click={() => (showMainMenu = false)}
              href={menuItem.url || ''}
              rel={menuItem.prefech ? 'prefetch' : null}
              title={menuItem.title || null}>
               {menuItem.contentHtml}
            </a>
          </span>
        {/each}
      </div>
      <div class="flex flex-col md:flex-row">
        {#each rightMenu as menuItem}
          <span class="inline-flex">
            <a
              class="block border-b-2 {(segment || '.') === menuItem.url ? 'border-gray-100' : 'border-gray-800'}
              flex-none mr-4 mt-4 md:mt-0 pb-2 hover:border-gray-400
              hover:text-gray-400"
              class:app-nav-link-current={(segment || '.') === menuItem.url}
              href={menuItem.url || ''}
              on:click={() => (showMainMenu = false)}
              rel={menuItem.prefech ? 'prefetch' : null}
              title={menuItem.title || null}>
               {menuItem.contentHtml}
            </a>
          </span>
        {/each}
        <span class="inline-flex">
          <span
            class="block border-b-2 border-gray-800 cursor-pointer flex-none
            mr-4 mt-4 md:mt-0 pb-2 hover:border-gray-400 hover:text-gray-400"
            on:click={() => {
              showMainMenu = false
              dispatch('openNewIssueModal')
            }}>
            Report an issue
          </span>
        </span>
        <span class="inline-flex">
          {#if $session.user}
            <div class="ml-4 relative">
              <button on:click={() => (showUserMenu = !showUserMenu)}>
                <Icon icon={faUser} />
                 {$session.user.name}
                <Icon icon={faChevronDown} />
              </button>
              {#if showUserMenu}
                <ul
                  class="absolute bg-gray-700 -mx-2 mt-10 p-2 right-0 rounded
                  shadow-md text-center top-0 overflow-auto z-30"
                  style="min-width: 9rem;">
                  <li>
                    <a href="logout" on:click|preventDefault={logout}>
                      <Icon icon={faSignOutAlt} />
                      Sign out
                    </a>
                  </li>
                </ul>
              {/if}
            </div>
          {:else}
            <a
              class="block border-b-2 {(segment || '.') === 'login' ? 'border-gray-100' : 'border-gray-800'}
              flex-none mr-4 mt-4 md:mt-0 pb-2 hover:border-gray-400
              hover:text-gray-400"
              href="login"
              on:click={() => (showMainMenu = false)}
              rel="prefetch">
              <Icon icon={faSignInAlt} />
              Sign in
            </a>
          {/if}
        </span>
      </div>
    </div>
  </div>
  <div class="block my-2 md:hidden">
    <button
      class="border border-gray-100 flex items-center px-3 py-2 rounded
      hover:border-gray-400 hover:text-gray-400"
      on:click={() => (showMainMenu = !showMainMenu)}>
      <Icon icon={faBars} />
    </button>
  </div>
</nav>
