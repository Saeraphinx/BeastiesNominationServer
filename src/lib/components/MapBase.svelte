<script lang="ts">
  import type { BSMap } from "$lib/shared/beatsaverTypes";
  import type { Snippet } from "svelte";
  import type { Characteristic, Difficulty } from "../shared/goodies";


  let props: {
    map: BSMap;
    characteristic: Characteristic;
    difficulty: Difficulty;
    children: Snippet;
  } = $props();

  
</script>

<div>

</div>