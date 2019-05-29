<script>
  import { createEventDispatcher } from "svelte"
  import { slugify } from "../strings"

  const dispatch = createEventDispatcher()

  const regExpEscape = s => {
    return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&")
  }

  export let className = ""
  let currentItemIndex = -1
  export let disabled = false
  let filteredItems = []
  export let fromStart = true // Default type ahead
  let inputField
  let isLoading = false
  let isOpen = false
  export let items = []
  export let minChar = 2
  export let name = null
  export let placeholder = ""
  export let required = false

  $: {
    if (items.length > 0) {
      const slug = slugify(name)
      filteredItems = items
        // .filter(item => {
        //   return fromStart
        //     ? slugify(item.name).startsWith(slugify(name))
        //     : slugify(item.name).includes(slugify(name))
        // })
        .map(item => {
          const nameTrimmed = name === null ? "" : name.trim()
          const itemNameHighlighted =
            nameTrimmed === ""
              ? item.name
              : item.name.replace(
                  RegExp(regExpEscape(nameTrimmed), "i"),
                  "<b>$&</b>",
                )
          return {
            ...item,
            label: `${itemNameHighlighted} (${item.id})`,
          }
        })
      currentItemIndex = filteredItems.findIndex(
        item => slugify(item.name) === slug,
      )
      isLoading = false
      isOpen = filteredItems.length > 0
    }
  }

  function close(index) {
    currentItemIndex = index
    const result = filteredItems[index]
    name = result.name
    dispatch("select", result)
    inputField.blur() // onBlur closes autocompletion menu.
  }

  function onBlur(event) {
    isLoading = false
    isOpen = false
    dispatch("blur", event)
  }

  function onFocus(event) {
    if (event.target.value === name) {
      isOpen = filteredItems.length > 0
    } else {
      isLoading = true
      dispatch("input", event.target.value)
    }
    dispatch("focus", event)
  }

  function onInput(event) {
    isLoading = true
    dispatch("input", event.target.value)
  }

  function onKeyDown(event) {
    switch (event.keyCode) {
      case 13:
        // Enter
        event.preventDefault() // Prevent form submission.
        if (currentItemIndex === -1) {
          currentItemIndex = 0 // Default select first item of list
        }
        this.close(currentItemIndex)
        // Simulate a Tab key down event, to move focus to next form field.
        this.onKeyDown({ keyCode: 9 })
        break
      case 27:
        // Escape
        event.preventDefault()
        inputField.blur()
        break
      case 38:
        // Arrow Up
        if (currentItemIndex > 0) {
          currentItemIndex -= 1
        }
        break
      case 40:
        // Arrow Down
        if (currentItemIndex < filteredItems.length - 1) {
          currentItemIndex += 1
        }
        break
    }
  }

  function windowOnClick(/* event */) {
    if (isOpen) {
      // Close autocompleter when a click occurs outside.
      inputField.blur()
    }
  }

  function windowOnKeyDown(event) {
    if (event.keyCode === 27) {
      // Close autocompleter when escape is pressed.
      inputField.blur()
    }
  }
</script>

<svelte:window on:click={windowOnClick} on:keydown={windowOnKeyDown} />

<div on:click|stopPropagation={() => {}}>
  <input
    autocomplete="off"
    bind:this={inputField}
    class={className}
    {disabled}
    {placeholder}
    {required}
    on:blur={onBlur}
    on:focus={onFocus}
    on:input={onInput}
    on:keydown={onKeyDown}
    type="text"
    value={name} />
  {#if isOpen}
    <ul
      class="absolute bg-white border shadow-md z-10"
      on:mousedown|preventDefault={() => {}}>
      {#each filteredItems as result, index}
        <li
          class="{index === currentItemIndex ? 'bg-gray-900 text-white ' : ''}
          hover:bg-gray-700 hover:text-white p-1"
          on:click={() => close(index)}>
          {@html result.label}
        </li>
      {/each}
    </ul>
  {/if}
  {#if isLoading}
    <slot>
      <p class="fallback">Chargement des données en cours...</p>
    </slot>
  {/if}
</div>
