<script>
  import { stores } from "@sapper/app"
  import { createEventDispatcher } from "svelte"

  import config from "../config"

  const dispatch = createEventDispatcher()
  export let segment
  const { session } = stores()
  let showMenu = false
</script>

<nav
  aria-label="main navigation"
  class="fixed flex items-top justify-between flex-wrap bg-teal-800 px-2
  w-full z-10"
  role="navigation">
  <div class="flex flex-col flex-grow items-baseline my-1 md:flex-row">
    <div class="flex items-baseline flex-shrink-0 text-white mr-6 my-2">
      <a
        class="font-medium italic text-teal-100 text-xl tracking-tight"
        href={config.url}
        rel="prefetch"
        title={config.missionStatement}>
        <img alt="" class="inline" height="16" src="/dfih-logo-150x74.png" width="32" />
         {config.title}
      </a>
    </div>
    <div
      class="{showMenu ? 'block' : 'hidden'} flex-grow w-full md:flex
      md:items-center md:w-auto">
      <div class="flex flex-col md:flex-grow md:flex-row">
        {#each config.leftMenu as menuItem}
          <span class="inline-flex">
            <a
              class="block border-b-2 flex-none mr-4 mt-4 pb-2 md:mt-0 hover:text-white {
                (segment || '.') === menuItem.url ? 'text-teal-200' : 'border-teal-800 text-teal-100'
              }"
              href={menuItem.url || ''}
              rel={menuItem.prefech ? 'prefetch' : null}
              title={menuItem.title || null}>
               {menuItem.contentHtml}
            </a>
          </span>
        {/each}
      </div>
      <div class="flex flex-col md:flex-row">
        {#each config.rightMenu as menuItem}
          <span class="inline-flex">
            <a
              class="block border-b-2 flex-none ml-4 mt-4 pb-2
              md:mt-0 hover:text-white {(segment || '.') === menuItem.url ? 'text-teal-200' : 'border-teal-800 text-teal-100'}"
              href={menuItem.url || ''}
              rel={menuItem.prefech ? 'prefetch' : null}
              title={menuItem.title || null}>
               {menuItem.contentHtml}
            </a>
          </span>
        {/each}
        <span class="inline-flex">
          <span
            class="block border-b-2 flex-none ml-4 mt-4 pb-2 md:mt-0 hover:text-white border-teal-800 text-teal-100"
            on:openNewIssueModal={() => dispatch('openNewIssueModal')}>
            Signaler un problème
          </span>
        </span>
        <span class="inline-flex">
          {#if $session.user}
            <i class="ml-4 text-teal-100">
              <i class="fas fa-user" />
               {$session.user.name}
            </i>
            <a
              class="block border-b-2 border-teal-800 ml-4 mt-4 pb-2 text-teal-100 md:inline-block md:mt-0 hover:text-white"
              href="logout"
              on:click|preventDefault={() => dispatch('logout')}>
              Déconnexion
            </a>
          {:else}
            <a
              class="block border-b-2 border-teal-800 ml-4 mt-4  pb-2 text-teal-100 md:inline-block md:mt-0 hover:text-white"
              href="login"
              rel="prefetch">
              Connexion
            </a>
          {/if}
        </span>
      </div>
    </div>
  </div>
  <div class="block my-2 md:hidden">
    <button
      class="border border-teal-400 flex items-center px-3 py-2 rounded
      text-teal-100 hover:border-white hover:text-white"
      on:click={() => (showMenu = !showMenu)}>
      <i class="fas fa-bars" />
    </button>
  </div>
</nav>
