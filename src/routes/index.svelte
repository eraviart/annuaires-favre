<script context="module">
  export async function preload() {
    const response = await this.fetch("years", {
      credentials: "same-origin",
    })
    const years = await response.json()
    return { years }
  }
</script>

<script>
  import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons/faExclamationTriangle"
  import Icon from "fa-svelte"

  import config from "../config"

  export let years
  let currentYear = null
  let pages = []

  async function toggleYear(year) {
    if (currentYear === year) {
      currentYear = null
      return
    }
    // eslint-disable-next-line no-undef
    const response = await fetch(`pages?year=${year}`, {
      credentials: "same-origin",
    })
    pages = await response.json()
    currentYear = year
  }
</script>

<svelte:head>
  <title>{config.title}</title>
</svelte:head>

<div class="container mx-auto">
  <article class="max-w-md mx-auto my-10 text-center">
    <img
      class="w-1/2 mx-auto block"
      src="dfih-logo-150x74.png"
      alt="Logo de DFIH" />
    <h1 class="text-3xl">Online interface to edit the text of Favre yearbooks</h1>
  </article>
  {#if years.length === 0}
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
          <p class="mb-2 font-bold">Welcom!</p>
          <p>No year has been entered yet.</p>
        </div>
      </div>
      <div class="flex justify-end mt-4 py-2">
        <a
          class="bg-orange-500 hover:bg-orange-700 font-bold px-4 py-2 rounded
          text-orange-100"
          href="saisie">
          Begin edition
        </a>
      </div>
    </section>
  {:else}
    <h2 class="text-2xl">Years</h2>
    <ul class="list-disc list-inside">
      {#each years as year}
        <li>
          <button on:click="{() => toggleYear(year)}">{year}</button>
          {#if year === currentYear && pages.length > 0}
            <div class="ml-4">
              <ul class="list-disc list-inside">
                {#each pages as page}
                  <li><a href="saisie?year={year}&page={page}">{page}</a></li>
                {/each}
              </ul>
              <div class="flex justify-start py-2">
                <a
                  class="bg-gray-600 hover:bg-gray-800 font-bold px-4 py-2 rounded
                  text-gray-100"
                  href="saisie?year={year}&page={Math.max(...pages, 0) + 1}">
                  New page
                </a>
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
    <div class="flex justify-start mt-4 py-2">
      <a
        class="bg-gray-600 hover:bg-gray-800 font-bold px-4 py-2 rounded
        text-gray-100"
        href="saisie?year={Math.max(...years, 1929) + 1}">
        New year
      </a>
    </div>
  {/if}
</div>
