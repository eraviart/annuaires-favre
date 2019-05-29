<script>
  import config from "../config"

  export let error
  export let status

  const dev = process.env.NODE_ENV === "development"
</script>

<svelte:head>
  <title>{status} | {config.title}</title>
</svelte:head>

<h1 class="text-2xl">{status}</h1>

<p>{error.message}</p>

{#if dev && error.stack}
  <pre class="whitespace-pre-wrap">{error.stack}</pre>
{/if}
