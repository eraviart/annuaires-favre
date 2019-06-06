<script context="module">
  import {
    validateStringToNumber,
    validateChain,
    validateInteger,
    validateMaybeTrimmedString,
    validateMissing,
    validateOption,
    validateSetValue,
    validateTest,
  } from "../validators/core"

  export async function preload(pageInfos, session) {
    const { user } = session
    if (!user) {
      return null
    }

    const [query, error] = validateQuery(pageInfos.query)
    if (error !== null) {
      this.error(
        400,
        `Erreurs dans les paramètres de la requête : ${JSON.stringify(
          error,
          null,
          2,
        )}`,
      )
    }
    const { page, year } = query

    const response = await this.fetch(`lines?page=${page}&year=${year}`, {
      credentials: "same-origin",
    })
    const lines = response.ok ? await response.json() : null

    return { lines, currentPage: page, currentYear: year, page, year }
  }

  function validateQuery(query) {
    if (query === null || query === undefined) {
      return [query, "Missing query"]
    }
    if (typeof query !== "object") {
      return [query, `Expected an object, got ${typeof query}`]
    }

    query = {
      ...query,
    }
    const remainingKeys = new Set(Object.keys(query))
    const errors = {}

    {
      const key = "page"
      remainingKeys.delete(key)
      const [value, error] = validateChain([
        validateMaybeTrimmedString,
        validateOption([
          [validateMissing, validateSetValue(1)],
          [
            validateStringToNumber,
            validateInteger,
            validateTest(value => value >= 1, "Expected a number ≥ 1"),
          ],
        ]),
      ])(query[key])
      query[key] = value
      if (error !== null) {
        errors[key] = error
      }
    }

    {
      const key = "year"
      remainingKeys.delete(key)
      const [value, error] = validateChain([
        validateMaybeTrimmedString,
        validateOption([
          [validateMissing, validateSetValue(1930)],
          [
            validateStringToNumber,
            validateInteger,
            validateTest(
              value => value >= 1700 && value < 2000,
              "Expected a year between 1700 and 1999",
            ),
          ],
        ]),
      ])(query[key])
      query[key] = value
      if (error !== null) {
        errors[key] = error
      }
    }

    for (let key of remainingKeys) {
      errors[key] = "Unexpected entry"
    }
    return [query, Object.keys(errors).length === 0 ? null : errors]
  }
</script>

<script>
  import { stores } from "@sapper/app"
  import fetch from "cross-fetch"

  import Autocomplete from "../components/Autocomplete.svelte"
  import ValidUser from "../components/ValidUser.svelte"
  import config from "../config"
  import { slugify } from "../strings"

  const { session } = stores()
  let cities = []
  let cityId = null
  let cityName = null
  let comment = ""
  let corporationId = null
  let corporationName = null
  let corporations = []
  let districts = []
  let districtId = null
  let districtName = null
  let editErrorCode = null
  let editErrorMessage = null
  let editErrors = {}
  let fair = false
  let lineId = null
  export let lines = null
  const now = new Date()
  export let page = 1
  let temporary = false
  const { user } = $session
  export let year = 1930

  export let currentPage = page
  export let currentYear = year

  $: citySlug = cityName === null ? null : slugify(cityName)

  $: corporationSlug =
    corporationName === null ? null : slugify(corporationName)

  async function autocompleteCity({ detail: term }) {
    editErrors = { ...editErrors }
    delete editErrors.cityName
    cityId = null
    cityName = term
    const response = await fetch(
      `autocomplete_city?district=${districtId}&q=${encodeURIComponent(
        term,
      )}&year=${year}`,
      {
        credentials: "same-origin",
      },
    )
    cities = response.ok ? await response.json() : []
  }

  async function autocompleteCorporation({ detail: term }) {
    editErrors = { ...editErrors }
    delete editErrors.corporationName
    corporationId = null
    corporationName = term
    const response = await fetch(
      `autocomplete_corporation?q=${encodeURIComponent(term)}`,
      {
        credentials: "same-origin",
      },
    )
    corporations = response.ok ? await response.json() : []
  }

  async function autocompleteDistrict({ detail: term }) {
    editErrors = { ...editErrors }
    delete editErrors.districtName
    districtId = null
    districtName = term
    const response = await fetch(
      `autocomplete_district?q=${encodeURIComponent(term)}&year=${year}`,
      {
        credentials: "same-origin",
      },
    )
    districts = response.ok ? await response.json() : []
  }

  function citySelected({ detail: item }) {
    cityId = Number(item.id)
    cityName = item.name
  }

  function corporationSelected({ detail: item }) {
    corporationId = Number(item.id)
    corporationName = item.name
  }

  async function createCity() {
    delete editErrors.cityName
    const response = await fetch("new_city", {
      body: JSON.stringify(
        {
          cityName,
          districtId,
          page,
          year,
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
      response.ok || (response.status >= 400 && response.status <= 403)
        ? await response.json()
        : { error: { code: response.status, message: response.statusText } }
    const { error } = result
    if (error) {
      cityId = null
      editErrorCode = error.code
      editErrorMessage = error.message
      editErrors = { ...editErrors, ...error.details }
    } else {
      cityId = result.id
      editErrorCode = null
      editErrorMessage = null
      editErrors = { ...editErrors }
    }
  }

  async function createCorporation() {
    delete editErrors.corporationName
    const response = await fetch("new_corporation", {
      body: JSON.stringify(
        {
          corporationName,
          page,
          year,
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
      response.ok || (response.status >= 400 && response.status <= 403)
        ? await response.json()
        : { error: { code: response.status, message: response.statusText } }
    const { error } = result
    if (error) {
      corporationId = null
      editErrorCode = error.code
      editErrorMessage = error.message
      editErrors = { ...editErrors, ...error.details }
    } else {
      corporationId = result.id
      editErrorCode = null
      editErrorMessage = null
      editErrors = { ...editErrors }
    }
  }

  function districtSelected({ detail: item }) {
    districtId = Number(item.id)
    districtName = item.name
  }

  function resetLineForm() {
    comment = null
    editErrorCode = null
    editErrorMessage = null
    editErrors = {}
    fair = false
    lineId = null
    temporary = false
  }

  async function submitEdit() {
    console.assert(year === currentYear)
    console.assert(page === currentPage)
    const upsertedLine = {
      id: null, // null means "upsert in progress".
      cityId,
      cityName,
      comment,
      corporationId,
      corporationName,
      districtId,
      districtName,
      fair,
      page,
      temporary,
      userId: user.id,
      userName: user.name,
      year,
    }
    const updatedLines = [...lines]
    if (lineId === null) {
      updatedLines.push(upsertedLine)
    } else {
      const lineIndex = lines.findIndex(line => line.id === lineId)
      console.assert(lineIndex >= 0)
      updatedLines[lineIndex] = upsertedLine
    }
    lines = updatedLines
    const response = await fetch("upsert_line", {
      body: JSON.stringify(
        {
          cityId,
          cityName,
          comment,
          corporationId,
          corporationName,
          districtId,
          districtName,
          fair,
          lineId,
          page,
          temporary,
          year,
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
      response.ok || (response.status >= 400 && response.status <= 403)
        ? await response.json()
        : { error: { code: response.status, message: response.statusText } }
    const { error } = result
    if (error) {
      editErrorCode = error.code
      editErrorMessage = error.message
      editErrors = { ...error.details }
    } else {
      upsertedLine.id = result.id // Also modifies updatedLines.
      lines = updatedLines
      resetLineForm()
    }
  }

  async function submitSearch() {
    const response = await fetch(`lines?page=${page}&year=${year}`, {
      credentials: "same-origin",
    })
    lines = response.ok ? await response.json() : null
    currentPage = page
    currentYear = year
  }

  function toggleSelectLine(line) {
    if (line.id === null) {
      // The line is currently being upserted, don't allow to select/unselect it.
      return
    }
    if (lineId !== line.id) {
      cityId = line.cityId
      cityName = line.cityName
      comment = line.comment
      corporationId = line.corporationId
      corporationName = line.corporationName
      districtId = line.districtId
      districtName = line.districtName
      fair = line.fair
      lineId = line.id
      page = line.page
      temporary = line.temporary
      year = line.year
    } else {
      resetLineForm()
    }
  }
</script>

<svelte:head>
  <title>Saisie | {config.title}</title>
</svelte:head>

<ValidUser>
  <div class="container mx-auto md:w-2/3 lg:w-1/2">
    <h1 class="text-2xl">Saisie des lignes d'une page</h1>

    <form class="m-3" on:submit|preventDefault={submitSearch}>
      <label for="year">Année</label>
      <input
        bind:value={year}
        class="appearance-none border focus:outline-none focus:shadow-outline
        leading-tight px-3 py-2 rounded shadow text-gray-700 w-full"
        id="year"
        max={now.getFullYear()}
        min="1600"
        type="number" />

      <label for="page">Page</label>
      <input
        bind:value={page}
        class="appearance-none border focus:outline-none focus:shadow-outline
        leading-tight px-3 py-2 rounded shadow text-gray-700 w-full"
        id="page"
        min="1"
        type="number" />

      <div class="flex justify-end mt-4 py-2">
        <button
          class="bg-gray-600 hover:bg-gray-800 font-bold px-4 py-2 rounded
          text-gray-100"
          type="submit">
          Rechercher
        </button>
      </div>
    </form>

    {#if year === currentYear && page === currentPage}
      {#if lines !== null && lines.length > 0}
        <table>
          <thead>
            <tr>
              <th />
              <th>Utilisateur</th>
              <th>Année</th>
              <th>Page</th>
              <th>Département</th>
              <th>Localité</th>
              <th>Entreprise</th>
              <th>Temporaire</th>
              <th>Jours de foire</th>
              <th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {#each lines as line}
              <tr
                class={line.id === lineId ? 'bg-gray-900 text-gray-100' : ''}
                on:click={() => toggleSelectLine(line)}>
                <td>
                  {#if line.id === null}
                    …
                  {:else}
                    <input
                      checked={line.id === lineId}
                      name="lineId"
                      type="radio"
                      value={line.id} />
                  {/if}
                </td>
                <td>{line.userName}</td>
                <td>{line.year}</td>
                <td>{line.page}</td>
                <td>{line.districtName}</td>
                <td>{line.cityName}</td>
                <td>{line.corporationName}</td>
                <td>{line.temporary ? '√' : ''}</td>
                <td>{line.fair ? '√' : ''}</td>
                <td>{line.comment || ''}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}

      <form class="m-3" on:submit|preventDefault={submitEdit}>
        {#if editErrorCode}
          <p
            class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
            text-red-100 w-full">
             {editErrorCode} {editErrorMessage || ''}
          </p>
        {/if}

        <Autocomplete
          className="appearance-none border focus:outline-none
          focus:shadow-outline leading-tight px-3 py-2 rounded shadow
          text-gray-700 w-full"
          items={districts}
          name={districtName}
          on:input={autocompleteDistrict}
          on:select={districtSelected}
          placeholder="Premières lettres d'un département…">
          <div class="notification">Chargement des départements…</div>
        </Autocomplete>
        {#if editErrors.districtName}
          <p
            class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
            text-red-100 w-full">
             {editErrors.districtName}
          </p>
        {/if}
        {#if districtId === null}
          <p
            class="bg-orange-600 border leading-tight px-3 py-2 rounded shadow
            text-orange-100 w-full">
            Un département est nécessaire au choix d'une localité.
          </p>
        {:else}
          <span
            class="border leading-tight px-3 py-2 rounded shadow text-gray-700
            w-full">
             {districtId || ''}
          </span>
        {/if}

        <Autocomplete
          className="appearance-none border focus:outline-none
          focus:shadow-outline leading-tight px-3 py-2 rounded shadow
          text-gray-700 w-full"
          disabled={districtId === null}
          items={cities}
          name={cityName}
          on:input={autocompleteCity}
          on:select={citySelected}
          placeholder="Premières lettres d'une localité…">
          <div class="notification">Chargement des localités…</div>
        </Autocomplete>
        {#if editErrors.cityName}
          <p
            class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
            text-red-100 w-full">
             {editErrors.cityName}
          </p>
        {/if}
        {#if cityId === null}
          {#if districtId !== null && citySlug && !cities.some(city => slugify(city.name) === citySlug)}
            <button on:click={createCity} type="button">
              Créer « {cityName} »
            </button>
          {/if}
        {:else}
          <span
            class="border leading-tight px-3 py-2 rounded shadow text-gray-700
            w-full">
             {cityId || ''}
          </span>
        {/if}

        <Autocomplete
          className="appearance-none border focus:outline-none
          focus:shadow-outline leading-tight px-3 py-2 rounded shadow
          text-gray-700 w-full"
          items={corporations}
          name={corporationName}
          on:input={autocompleteCorporation}
          on:select={corporationSelected}
          placeholder="Premières lettres d'une entreprise…">
          <div class="notification">Chargement des entreprises…</div>
        </Autocomplete>
        {#if editErrors.corporationName}
          <p
            class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
            text-red-100 w-full">
             {editErrors.corporationName}
          </p>
        {/if}
        {#if corporationId === null}
          {#if corporationSlug && !corporations.some(corporation => slugify(corporation.name) === corporationSlug)}
            <button on:click={createCorporation} type="button">
              Créer « {corporationName} »
            </button>
          {/if}
        {:else}
          <span
            class="border leading-tight px-3 py-2 rounded shadow text-gray-700
            w-full">
             {corporationId || ''}
          </span>
        {/if}

        <label>
          <input bind:checked={temporary} type="checkbox" />
          Bureau temporaire
        </label>
        <label>
          <input bind:checked={fair} type="checkbox" />
          Jours de foire
        </label>

        <label for="comment">Comment</label>
        <textarea
          bind:value={comment}
          class="appearance-none border focus:outline-none focus:shadow-outline
          leading-tight px-3 py-2 rounded shadow text-gray-700 w-full"
          id="comment"
          rows="4" />

        <div class="flex justify-end mt-4 py-2">
          <button
            class="bg-gray-600 hover:bg-gray-800 font-bold px-4 py-2 rounded
            text-gray-100"
            type="submit">
            {#if lineId === null}Ajouter{:else}Modifier{/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
</ValidUser>
