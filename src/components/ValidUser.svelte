<script>
  import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons/faExclamationTriangle"
  import { faSignInAlt } from "@fortawesome/free-solid-svg-icons/faSignInAlt"
  import Icon from "fa-svelte"

  import { stores } from "@sapper/app"
  const { session } = stores()
</script>

{#if $session.user}
  <slot />
{:else}
  <section
    class="bg-orange-100 border-l-4 border-orange-500 mx-auto my-4 p-4
    text-orange-500 md:w-2/3 lg:1/2">
    <div class="flex mx-auto p-4">
      <div class="mr-4">
        <div
          class="h-10 w-10 text-orange-100 bg-orange-500 rounded-full flex
          justify-center items-center">
          <Icon icon={faExclamationTriangle} />
        </div>
      </div>
      <div>
        <p class="mb-2 font-bold">Identification nécessaire</p>
        <p>Vous devez vous connecter pour pouvoir saisir.</p>
      </div>
    </div>
    <div class="flex justify-end mt-4 py-2">
      <a
        class="bg-orange-500 hover:bg-orange-700 font-bold px-4 py-2 rounded
        text-orange-100"
        href="login">
        <Icon icon={faSignInAlt} />
         Connexion
      </a>
    </div>
  </section>
{/if}
