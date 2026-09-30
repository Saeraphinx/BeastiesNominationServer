<script lang="ts">
  let props = $props();
</script>

<div class="flex-col-center">
  <p class="text-2xl m-2">An error occurred.</p>
  {#if props.error}
    <pre class="text-red-500">{props.error.message}</pre>
  {/if}
</div>