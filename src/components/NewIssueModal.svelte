<script>
  import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons/faExclamationTriangle"
  import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes"
  import Icon from "fa-svelte"
  import { createEventDispatcher } from "svelte"

  export let description = ""
  const dispatch = createEventDispatcher()
  let error = null
  export let title = ""
  let webUrl = null

  async function submit() {
    // eslint-disable-next-line no-undef
    const response = await fetch("new_issue", {
      body: JSON.stringify(
        {
          description: `${description}\n\n----\n\nCette remarque a été effectuée sur la page ${
            window.location.href // eslint-disable-line no-undef
          }`,
          title,
        },
        null,
        2,
      ),
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "POST",
    })
    const result =
      response.ok || response.status === 400
        ? await response.json()
        : { error: { code: response.status, message: response.statusText } }
    if (result.error) {
      console.log(result.error.code, result.error.message)
    }
    ;({ description, error, title, web_url: webUrl } = result)
  }
</script>

<div class="fixed flex inset-0 z-50" role="dialog">
  <div class="bg-gray-900 fixed opacity-75 inset-0 z-40" />
  <div
    class="bg-white flex flex-col m-auto max-h-full max-w-2xl sm:mt-16
    opacity-100 overflow-auto pb-4 pt-4 px-4 relative rounded shadow z-50">
    <div class="border-b mb-4 pb-3">
      <h1 class="font-medium text-lg">Effectuer une remarque</h1>
      <div class="absolute p-4 top-0 right-0">
        <button
          class="border-2 border-gray-100 hover:border-gray-400 p-1 rounded text-gray-600 hover:text-gray-800"
          on:click={() => dispatch('close')}
          type="button">
          <Icon icon={faTimes} />
        </button>
      </div>
    </div>
    {#if error === null && webUrl === null}
      <form on:submit|preventDefault={submit}>
        <div>
          <p class="text-lg">
            Veuillez décrire le problème que vous rencontrez sur cette page ou
            la suggestion que vous proposez…
          </p>
          <div
            class="bg-orange-100 border border-orange-400 my-4 p-4 rounded
            text-orange-600"
            role="alert">
            <p class="font-medium mb-2 text-lg">
              <Icon icon={faExclamationTriangle} />&nbsp;Attention !
            </p>
            <p class="leading-normal">
              Votre remarque sera anonyme, mais
              <b>publique</b>
              . Tout le monde pourra la lire.
            </p>
          </div>
          <div class="mb-5">
            <label class="block font-bold mb-2 text-sm" for="title">
              Titre
            </label>
            <input
              class="appearance-none border leading-tight focus:outline-none
              px-3 py-2 rounded shadow focus:shadow-outline w-full"
              id="title"
              placeholder="Titre de la remarque"
              required
              type="text"
              bind:value={title} />
          </div>
          <div>
            <label class="block font-bold mb-2 text-sm" for="description">
              Description
            </label>
            <textarea
              class="appearance-none border leading-tight focus:outline-none
              px-3 py-2 rounded shadow focus:shadow-outline w-full"
              id="description"
              placeholder="Description de la remarque"
              required
              rows="10"
              bind:value={description} />
          </div>
        </div>
        <div class="flex justify-end mt-6">
          <button
            class="bg-gray-600 hover:bg-gray-800 font-bold px-4 py-2 rounded
            text-white"
            type="submit">
            Envoyer
          </button>
        </div>
      </form>
    {:else}
      <div>
        {#if error === null}
          <div
            class="bg-green-100 border border-green-400 my-4 p-4 rounded
            text-green-600"
            role="alert">
            <p class="leading-normal">
              Votre remarque a été transmise. Vous pouvez la suivre sur :
              <br />
              <a class="text-blue-500 underline" href={webUrl} target="_blank">
                {webUrl}
              </a>
              <br />
            </p>
            <p class="leading-normal">
              <b>Merci</b>
              de nous aider ainsi à améliorer le site !
            </p>
          </div>
        {:else}
          <div
            class="bg-red-100 border border-red-400 my-4 p-4 rounded
            text-red-600"
            role="alert">
            <p class="leading-normal">
              Une erreur est survenue lors de l'envoi de votre remarque.
              Veuillez réessayer plus tard.
            </p>
          </div>
          <pre class="whitespace-pre-wrap">
             {JSON.stringify(error, null, 2)}
          </pre>
        {/if}
      </div>
      <div class="flex justify-end mt-6">
        <button
          class="bg-gray-600 hover:bg-gray-800 font-bold px-4 py-2 rounded
          text-white"
          on:click={() => dispatch('close')}
          type="button">
          Fermer
        </button>
      </div>
    {/if}
  </div>
</div>
