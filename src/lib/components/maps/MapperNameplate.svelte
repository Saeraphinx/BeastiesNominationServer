<script lang="ts">
  import type { BSMap } from "../../shared/beatsaverTypes";

  let props: {
    mapper: BSMap[`uploader`]
  } = $props();

  let ringClass = $derived.by(() => {
    if (props.mapper.verifiedMapper) {
      return `ring-1 ring-purple-700`;
    }
    return `ring-1 ring-gray-300`;
  });
</script>

<div class="flex flex-row justify-center items-center bg-black/75 rounded-full {ringClass}">
    <img class="h-6 w-6 rounded-full" src={props.mapper.avatar} alt={`Avatar of ${props.mapper.name}`} />
    <p class="text-sm/snug px-2 text-white">{props.mapper.name}</p>
</div>