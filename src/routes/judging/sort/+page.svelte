<script lang="ts">
  import { onMount } from "svelte";
  import type { InferAttributes } from "sequelize";
  import type { Submission } from "../../../lib/server/database";
  import { getSubmissions } from "../../api/sorting.remote";
  import SortMap from "../../../lib/components/maps/SortMap.svelte";
  import { type BSMap } from "../../../lib/shared/beatsaverTypes";
  import { getBulkMaps } from "../../../lib/shared/getMap";
  import { getBeatSaverMaps } from "../../api/judging.remote";
  import Button from "../../../lib/components/common/Button.svelte";
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";

  let bsAPIData: Record<string, BSMap> = $state({});
  let submissions: InferAttributes<Submission>[] = $state([]);
  let currentPage = $state(1);
  let currentlyShowingSubmissions: InferAttributes<Submission>[] = $derived.by(() => {
    const start = (currentPage - 1) * 25;
    const end = start + 25;
    console.log("Currently showing submissions from index", start, "to", end);
    let ret = submissions.slice(start, end);
    console.log("Submissions being returned:", ret);
    return ret;
  });

  let promise = $state(fetchSubmissions());
  async function fetchSubmissions() {
    await getSubmissions({}).then(data => {
      submissions = data;
    });

    bsAPIData = Object.fromEntries((await getBeatSaverMaps(submissions.map(submission => submission.bsrId!).filter(Boolean))).map(map => [map.id, map]));
  }
</script>

<div class="flex flex-col gap-4 justify-center items-center mb-24">
  <div>
    <p>Submissions:</p>
    <Button onclick={() => promise = fetchSubmissions()}>Fetch Submissions</Button>
  </div>
  <div class="flex flex-row flex-wrap justify-center items-center gap-4">
    {#await promise then _}
      {#each currentlyShowingSubmissions as submission, index (submission.nominationId)}
        <span out:fade={{ duration: 300 }} animate:flip={{ duration: 300 }}>
          <SortMap submission={submission} bsAPI={bsAPIData[submission.bsrId!]} onApprove={(res) => submissions = submissions.filter(s => s.nominationId !== submission.nominationId && !res.duplicateIds.includes(s.nominationId))} />
        </span>
      {/each}
    {/await}
  </div>
</div>
