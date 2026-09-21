<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import type { Submission } from "../../../lib/server/database";
  import { getSubmissions } from "../../api/sorting.remote";
  import SortMap from "../../../lib/components/SortMap.svelte";
  import { type BSMap } from "../../../lib/shared/beatsaverTypes";
  import { getBulkMaps } from "../../../lib/shared/getMap";

  let bsAPIData: Record<string, BSMap> = {};
  let submissions: InferAttributes<Submission>[] = $state([]);
  let currentPage = $state(1);
  let currentlyShowingSubmissions: InferAttributes<Submission>[] = $derived.by(() => {
    const start = (currentPage - 1) * 25;
    const end = start + 25;
    return submissions.slice(start, end);
  });

  async function fetchSubmissions() {
    getSubmissions({}).then(data => {
      submissions = data;
    });

    const mapIds = submissions.map(submission => submission.bsrId).filter(v => v && Object.keys(bsAPIData).indexOf(v) === -1) as string[];
    //split mapIds into chunks of 50
    const chunks: string[][] = [];
    for (let i = 0; i < mapIds.length; i += 50) {
      chunks.push(mapIds.slice(i, i + 50));
    }
    for (const chunk of chunks) {
      // fetch the maps for each chunk and merge into bsAPIData
      await getBulkMaps(chunk).then(data => {
        bsAPIData = { ...bsAPIData, ...data };
      });
    }
  }
</script>

<div>
  <div>
    <p>Submissions:</p>
  </div>
  <div>
    {#each currentlyShowingSubmissions as submission}
      <SortMap submission={submission} bsAPI={bsAPIData[submission.bsrId!]} />
    {/each}
  </div>
</div>
