<script lang="ts">
  import type { BSMap } from "$lib/shared/beatsaverTypes";
  import type { Snippet } from "svelte";
  import type { Characteristic, Difficulty } from "../shared/goodies";
  import MapperNameplate from "./MapperNameplate.svelte";


  let props: {
    map: BSMap;
    characteristic?: Characteristic;
    difficulty?: Difficulty;
    children?: Snippet;
  } = $props();

  let mappers = $derived.by(() => {
    let mappersArr = [props.map.uploader, ...(props.map.collaborators ?? [])];
    let overflow = 0;
    if (mappersArr.length > 5) {
        overflow = mappersArr.length - 5;
        mappersArr = mappersArr.slice(0, 5);
    }
    return { arr: mappersArr, overflow: overflow > 0, overflowCount: overflow };;
  });
</script>

<div class="flex flex-col justify-center items-center w-64 p-2 gap-2 rounded-lg bg-black/30 overflow-hidden">
    <a class="overflow-hidden text-ellipsis whitespace-nowrap max-w-60 hover:text-blue-300" href={`https://beatsaver.com/maps/${props.map.id}`} target="_blank" rel="noopener noreferrer">{props.map.name}</a>
    <img class="h-32 w-32 rounded-2xl" src={props.map.versions[0].coverURL} alt={`Cover of ${props.map.name}`} />
    <div class="flex flex-row justify-center items-center gap-2 flex-wrap">
        {#each mappers.arr as mapper}
            <MapperNameplate mapper={mapper} />
        {/each}
        {#if mappers.overflow}
            <p>+{mappers.overflowCount} more</p>
        {/if}
    </div>
    <div>
        {#if props.children}
            {@render props.children()}
        {/if}
    </div>
</div>