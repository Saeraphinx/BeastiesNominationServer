<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import { fade, fly } from "svelte/transition";

  let {
    showDialog = $bindable(true),
    children,
    class: className,
    contentClass,
  }: {
    showDialog: boolean;
    children: Snippet;
    class?: ClassValue;
    contentClass?: ClassValue;
  } = $props();
</script>

{#if showDialog}
  <div transition:fade={{ duration: 150 }} class="fixed inset-0 z-10 flex-col-center bg-black/30 {className}" role="presentation" onclick={() => (showDialog = false)}>
    <button class="absolute top-2 right-2 p-2 z-30 bg-black/50 hover:bg-black/70 text-white" onclick={() => (showDialog = false)}>
        Close
      </button>
    <span class="inset-0 flex-col-center w-full h-full z-20" transition:fly={{ y: 200, duration: 300 }}>
      {@render children()}
    </span>
  </div>
{/if}
