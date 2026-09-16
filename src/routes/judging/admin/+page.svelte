<script lang="ts">
  import DiffIcon from "../../../lib/components/DiffIcon.svelte";
  import MapBase from "../../../lib/components/MapBase.svelte";
  import { getBulkMaps } from "../../../lib/shared/getMap";

</script>

<DiffIcon difficulty="Easy" characteristic="Standard" size="sm" />
{#await getBulkMaps([`51058`, `d00c`, `5308f`])}
    
{:then maps} 
    <p>Base</p>
    <div class="flex flex-row gap-2">
        <MapBase map={maps[`51058`]} />
        <MapBase map={maps[`d00c`]} />
        <MapBase map={maps[`5308f`]} />
    </div>
{/await}