<script context="module">
  import {
    validateStringToNumber,
    validateChain,
    validateInteger,
    validateString,
    validateTest,
  } from "../validators/core"

  export async function preload(pageInfos, session) {
    const { user } = session
    if (!user) {
      return null
    }

    const [query, error] = validateQuery(pageInfos.query)
    if (error !== null) {
      this.error(400, `Erreurs dans les paramètres de la requête : ${JSON.stringify(error, null, 2)}`)
    }
    const { page, year } = query

    const response = await this.fetch(`lines?page=${page}&year=${year}`, {
      credentials: "same-origin",
    })
    const lines = response.ok ? await response.json() : null

    return { lines, page, year }
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
        validateString,
        validateStringToNumber,
        validateInteger,
        validateTest(
          value => value >= 1,
          "Expected a number ≥ 1",
        ),
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
        validateString,
        validateStringToNumber,
        validateInteger,
        validateTest(
          value => value >= 1700 && value < 2000,
          "Expected a year between 1700 and 1999",
        ),
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
  let errorCode = null
  let errorMessage = null
  let errors = {}
  let fair = false
  let lineId = null
  export let lines = null
  export let page = 1
  let temporary = false
  export let year = 1930

  $: citySlug = cityName === null ? null : slugify(cityName)

  $: corporationSlug =
    corporationName === null ? null : slugify(corporationName)

  async function autocompleteCity({ detail: term }) {
    errors = { ...errors }
    delete errors.cityName
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
    errors = { ...errors }
    delete errors.corporationName
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
    errors = { ...errors }
    delete errors.districtName
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
    delete errors.cityName
    delete errors.page
    delete errors.year
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
      errorCode = error.code
      errorMessage = error.message
      errors = { ...errors, ...error.details }
    } else {
      cityId = result.id
      errorCode = null
      errorMessage = null
      errors = { ...errors }
    }
  }

  async function createCorporation() {
    delete errors.corporationName
    delete errors.page
    delete errors.year
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
      errorCode = error.code
      errorMessage = error.message
      errors = { ...errors, ...error.details }
    } else {
      corporationId = result.id
      errorCode = null
      errorMessage = null
      errors = { ...errors }
    }
  }

  function districtSelected({ detail: item }) {
    districtId = Number(item.id)
    districtName = item.name
  }

  function resetLineForm() {
    comment = null
    errorCode = null
    errorMessage = null
    errors = {}
    fair = false
    lineId = null
    temporary = false
  }

  async function submitForm() {
    const { user } = $session

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
      errorCode = error.code
      errorMessage = error.message
      errors = { ...error.details }
    } else {
      upsertedLine.id = result.id // Also modifies updatedLines.
      lines = updatedLines
      resetLineForm()
    }
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
  <h1 class="text-2xl">Saisie</h1>

  {#if lines !== null}
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
            class={line.id === lineId ? 'bg-gray-900 text-white' : ''}
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

  <form class="m-3" on:submit|preventDefault={submitForm}>
    {#if errorCode}
      <p
        class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
        text-white w-full">
         {errorCode} {errorMessage || ''}
      </p>
    {/if}

    <label for="year">Année</label>
    <input
      bind:value={year}
      class="appearance-none border focus:outline-none focus:shadow-outline
      leading-tight px-3 py-2 rounded shadow text-gray-700 w-full"
      id="year"
      type="number" />
    {#if errors.year}
      <p
        class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
        text-white w-full">
         {errors.year}
      </p>
    {/if}

    <label for="page">Page</label>
    <input
      bind:value={page}
      class="appearance-none border focus:outline-none focus:shadow-outline
      leading-tight px-3 py-2 rounded shadow text-gray-700 w-full"
      id="page"
      type="number" />
    {#if errors.page}
      <p
        class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
        text-white w-full">
         {errors.page}
      </p>
    {/if}

    <Autocomplete
      className="appearance-none border focus:outline-none focus:shadow-outline
      leading-tight px-3 py-2 rounded shadow text-gray-700 w-full"
      items={districts}
      name={districtName}
      on:input={autocompleteDistrict}
      on:select={districtSelected}
      placeholder="Premières lettres d'un département…">
      <div class="notification">Chargement des départements…</div>
    </Autocomplete>
    {#if errors.districtName}
      <p
        class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
        text-white w-full">
         {errors.districtName}
      </p>
    {/if}
    {#if districtId === null}
      <p
        class="bg-orange-600 border leading-tight px-3 py-2 rounded shadow
        text-white w-full">
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
      className="appearance-none border focus:outline-none focus:shadow-outline
      leading-tight px-3 py-2 rounded shadow text-gray-700 w-full"
      disabled={districtId === null}
      items={cities}
      name={cityName}
      on:input={autocompleteCity}
      on:select={citySelected}
      placeholder="Premières lettres d'une localité…">
      <div class="notification">Chargement des localités…</div>
    </Autocomplete>
    {#if errors.cityName}
      <p
        class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
        text-white w-full">
         {errors.cityName}
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
      className="appearance-none border focus:outline-none focus:shadow-outline
      leading-tight px-3 py-2 rounded shadow text-gray-700 w-full"
      items={corporations}
      name={corporationName}
      on:input={autocompleteCorporation}
      on:select={corporationSelected}
      placeholder="Premières lettres d'une entreprise…">
      <div class="notification">Chargement des entreprises…</div>
    </Autocomplete>
    {#if errors.corporationName}
      <p
        class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
        text-white w-full">
         {errors.corporationName}
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

    <button type="submit">
      {#if lineId === null}Ajouter{:else}Modifier{/if}
    </button>
  </form>
</ValidUser>
