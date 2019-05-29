<script>
  export let errors
</script>

{#if errors}
  <ul class="error-messages list-disc">
    {#each Object.entries(errors) as [key, message]}
      <li>{key}: {message}</li>
    {/each}
  </ul>
{/if}
