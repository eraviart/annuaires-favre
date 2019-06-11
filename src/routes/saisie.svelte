<script context="module">
  import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons/faExclamationTriangle"
  import Icon from "fa-svelte"

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
  import { goto, stores } from "@sapper/app"
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

  async function autocompleteBank({ detail: term }) {
    editErrors = { ...editErrors }
    delete editErrors.corporationName
    corporationId = null
    corporationName = term
    const response = await fetch(
      `autocomplete_bank?q=${encodeURIComponent(term)}`,
      {
        credentials: "same-origin",
      },
    )
    corporations = response.ok ? await response.json() : []
  }

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

  // async function autocompleteCorporation({ detail: term }) {
  //   editErrors = { ...editErrors }
  //   delete editErrors.corporationName
  //   corporationId = null
  //   corporationName = term
  //   const response = await fetch(
  //     `autocomplete_corporation?q=${encodeURIComponent(term)}`,
  //     {
  //       credentials: "same-origin",
  //     },
  //   )
  //   corporations = response.ok ? await response.json() : []
  // }

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
    const itemId = Number(item.id)
    if (itemId !== districtId) {
      districtId = itemId
      districtName = item.name
      cities = []
      cityId = null
    }
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
      id: null, // Set later.
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
      upsertedLine.id = result.id
      const updatedLines = [...lines]
      if (lineId === null) {
        updatedLines.push(upsertedLine)
      } else {
        const lineIndex = lines.findIndex(line => line.id === lineId)
        console.assert(lineIndex >= 0)
        updatedLines[lineIndex] = upsertedLine
      }
      lines = updatedLines
      resetLineForm()
    }
  }

  async function submitSearch() {
    goto(`saisie?year=${year}&page=${page}`)
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
    <h1 class="text-2xl">Saisie des lignes d'une page <span class="text-gray-600">/ Edition of the lines in a page</span></h1>

    <form class="m-3" on:submit|preventDefault={submitSearch}>
      <div class="my-2">
        <label for="year">Année <span class="text-gray-600">/ Year</span></label>
        <input
          bind:value={year}
          class="appearance-none border focus:outline-none focus:shadow-outline
          leading-tight px-3 py-2 rounded shadow text-gray-700 w-full"
          id="year"
          max={now.getFullYear()}
          min="1600"
          required
          type="number" />
      </div>

      <div class="my-2">
        <label for="page">Page</label>
        <input
          bind:value={page}
          class="appearance-none border focus:outline-none focus:shadow-outline
          leading-tight px-3 py-2 rounded shadow text-gray-700 w-full"
          id="page"
          min="1"
          required
          type="number" />
      </div>

      {#if year !== currentYear || page !== currentPage}
        <div class="flex justify-end mt-4 py-2">
          <button
            class="bg-gray-600 hover:bg-gray-800 font-bold px-4 py-2 rounded
            text-gray-100"
            type="submit">
            Rechercher <span class="text-gray-300">/ Search</span>
          </button>
        </div>
      {/if}
    </form>
  </div>

  {#if year === currentYear && page === currentPage}
    {#if lines !== null && lines.length > 0}
      <div class="py-2">
        <table class="border container mx-auto text-center">
          <thead class="border-b border-t">
            <tr>
              <!-- <th>Année</th>
              <th>Page</th> -->
              <th>Département</th>
              <th>Localité</th>
              <th>Banque</th>
              <th>Temporaire</th>
              <th>Jours de foire</th>
              <th>Commentaire</th>
              <th>Utilisateur</th>
            </tr>
            <tr class="text-gray-600">
              <!-- <th>Year</th>
              <th>Page</th> -->
              <th>District</th>
              <th>City</th>
              <th>Bank</th>
              <th>Temporary</th>
              <th>Fair Days</th>
              <th>Comment</th>
              <th>Username</th>
            </tr>
          </thead>
          <tbody>
            {#each lines as line, lineIndex (`line_${line.id}`)}
              <tr
                class="{line.id === lineId ? 'bg-gray-700 text-gray-100' : lineIndex % 2 === 0 ? 'bg-white' : ''}
                border-b border-t"
                on:click={() => toggleSelectLine(line)}>
                <!-- <td>{line.year}</td>
                <td>{line.page}</td> -->
                <td>
                   {line.districtName}
                  <span class="text-gray-500">({line.districtId})</span>
                </td>
                <td>
                   {line.cityName}
                  <span class="text-gray-500">({line.cityId})</span>
                </td>
                <td>
                   {line.corporationName}
                  <span class="text-gray-500">({line.corporationId})</span>
                </td>
                <td>{line.temporary ? '√' : ''}</td>
                <td>{line.fair ? '√' : ''}</td>
                <td>{line.comment || ''}</td>
                <td>
                  <span class="text-gray-500">{line.userName}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <div class="container mx-auto md:w-2/3 lg:w-1/2">
      <form class="m-3" on:submit|preventDefault={submitEdit}>
        {#if editErrorCode}
          <section
            class="bg-red-100 border-l-4 border-red-500 mx-auto my-4 p-4
            text-red-500 md:w-2/3 lg:1/2">
            <div class="flex mx-auto p-4">
              <div class="mr-4">
                <div
                  class="h-10 w-10 text-red-100 bg-red-500 rounded-full flex
                  justify-center items-center">
                  <Icon icon={faExclamationTriangle} />
                </div>
              </div>
              <div>
                <p class="mb-2 font-bold">
                   {editErrorCode} {editErrorMessage || ''}
                </p>
              </div>
            </div>
          </section>
        {/if}

        <div class="my-2">
          <label for="districtName">Département <span class="text-gray-600">/ District</span></label>
          <div class="flex">
            <Autocomplete
              divClass="w-full"
              id="districtName"
              inputClass="appearance-none border focus:outline-none
              focus:shadow-outline leading-tight px-3 py-2 rounded shadow
              text-gray-700 w-full"
              items={districts}
              name={districtName}
              on:input={autocompleteDistrict}
              on:select={districtSelected}
              placeholder="Premières lettres d'un département…">
              <div class="notification">Chargement des départements…</div>
            </Autocomplete>
            {#if districtId !== null}
              <span
                class="border leading-tight px-3 py-2 rounded shadow
                text-gray-700">
                 {districtId || ''}
              </span>
            {/if}
          </div>
          {#if editErrors.districtName}
            <p
              class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
              text-red-100 w-full">
               {editErrors.districtName}
            </p>
          {/if}
        </div>

        <div class="my-2">
          <label for="cityName">Commune <span class="text-gray-600">/ City</span></label>
          <div class="flex">
            <Autocomplete
              divClass="w-full"
              disabled={districtId === null}
              id="cityName"
              inputClass="appearance-none border focus:outline-none
              focus:shadow-outline leading-tight px-3 py-2 rounded shadow
              text-gray-700 w-full"
              items={cities}
              name={cityName}
              on:input={autocompleteCity}
              on:select={citySelected}
              placeholder="Premières lettres d'une localité…">
              <div class="notification">Chargement des localités…</div>
            </Autocomplete>
            {#if cityId === null}
              {#if districtId !== null && citySlug && !cities.some(city => slugify(city.name) === citySlug)}
                <button
                  class="border border-red-600 hover:border-red-800 leading-tight ml-1
                  px-3 py-2 rounded shadow text-red-600 hover:text-red-800"
                  on:click={createCity}
                  type="button">
                  Créer <span class="text-red-400">/ New</span> « {cityName} »
                </button>
              {/if}
            {:else}
              <span
                class="border leading-tight px-3 py-2 rounded shadow
                text-gray-700">
                 {cityId || ''}
              </span>
            {/if}
          </div>
          {#if editErrors.cityName}
            <p
              class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
              text-red-100 w-full">
               {editErrors.cityName}
            </p>
          {:else if districtId === null}
            <p class="leading-tight px-3 py-2 text-orange-500">
              Un département est nécessaire au choix d'une localité.
              <span class="text-orange-400">A district is needed to be able to choose a city</span>
            </p>
          {/if}
        </div>

        <div class="my-2">
          <label for="corporationName">Banque <span class="text-gray-600">/ Bank</span></label>
          <div class="flex">
            <Autocomplete
              divClass="w-full"
              id="corporationName"
              inputClass="appearance-none border focus:outline-none
              focus:shadow-outline leading-tight px-3 py-2 rounded shadow
              text-gray-700 w-full"
              items={corporations}
              name={corporationName}
              on:input={autocompleteBank}
              on:select={corporationSelected}
              placeholder="Premières lettres d'une entreprise…">
              <div class="notification">Chargement des entreprises…</div>
            </Autocomplete>
            {#if corporationId === null}
              {#if corporationSlug && !corporations.some(corporation => slugify(corporation.name) === corporationSlug)}
                <button
                  class="border border-red-600 hover:border-red-800 leading-tight ml-1
                  px-3 py-2 rounded shadow text-red-600 hover:text-red-800"
                  on:click={createCorporation}
                  type="button">
                  Créer <span class="text-red-400">/ New</span> « {corporationName} »
                </button>
              {/if}
            {:else}
              <span
                class="border leading-tight px-3 py-2 rounded shadow text-gray-700">
                {corporationId || ''}
              </span>
            {/if}
          </div>
          {#if editErrors.corporationName}
            <p
              class="bg-red-500 border leading-tight px-3 py-2 rounded shadow
              text-red-100 w-full">
               {editErrors.corporationName}
            </p>
          {/if}
        </div>

        <fieldset class="my-2">
          <legend>Ouverture <span class="text-gray-600">/ Opening</span></legend>
          <label>
            <input bind:checked={temporary} type="checkbox" />
            Bureau temporaire <span class="text-gray-600">/ Temporary Office</span>
          </label>
          <label>
            <input bind:checked={fair} type="checkbox" />
            Jours de foire <span class="text-gray-600">/ Fair Days</span>
          </label>
        </fieldset>

        <div class="my-2">
          <label for="comment">Commentaire <span class="text-gray-600">/ Comment</span> </label>
          <textarea
            bind:value={comment}
            class="appearance-none border focus:outline-none
            focus:shadow-outline leading-tight px-3 py-2 rounded shadow
            text-gray-700 w-full"
            id="comment"
            rows="4" />
        </div>

        <div class="flex justify-end mt-4 py-2">
          <button
            class="bg-gray-600 hover:bg-gray-800 font-bold px-4 py-2 rounded
            text-gray-100"
            type="submit">
            {#if lineId === null
              }Ajouter <span class="text-gray-300">/ Add</span>{
            :else
              }Modifier <span class="text-gray-300">/ Update</span>{
            /if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</ValidUser>
