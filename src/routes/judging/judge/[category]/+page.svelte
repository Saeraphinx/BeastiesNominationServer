<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import type { BSMap } from "../../../../lib/shared/beatsaverTypes.js";
  import { getBeatSaverMaps, getSortedSubmissions, getVotes } from "../../../api/judging.remote.js";
  import { getSubmissions } from "../../../api/sorting.remote.js";
  import type { JudgeVote, SortedSubmission } from "../../../../lib/server/database.js";
  import JudgeMap from "../../../../lib/components/maps/JudgeMap.svelte";
  import Button from "../../../../lib/components/common/Button.svelte";

  const { data: _internal } = $props();
  const { pageData, judge } = $derived(_internal);

  let bsAPIData: Record<string, BSMap> = $state({});
  let submissions: InferAttributes<SortedSubmission>[] = $state([]);
  let votes: InferAttributes<JudgeVote>[] = $state([]);
  let currentPage = $state(1);
  let currentlyShowingSubmissions: InferAttributes<SortedSubmission>[] = $derived.by(() => {
    const start = (currentPage - 1) * 25;
    const end = start + 25;
    console.log("Currently showing submissions from index", start, "to", end);
    let ret = submissions.slice(start, end);
    console.log("Submissions being returned:", ret);
    return ret;
  });

  let promise = $state(fetchSubmissions());
  async function fetchSubmissions() {
    await getSortedSubmissions({
      category: pageData.category,
    }).then((data) => {
      submissions = data;
    });

    const mapIds = submissions.map((submission) => submission.bsrId!).filter(Boolean);
    bsAPIData = Object.fromEntries((await getBeatSaverMaps(mapIds)).map((map) => [map.id, map]));
    votes = await getVotes({
      submissionIds: submissions.map((submission) => submission.id),
    });
  }
</script>

<div class="flex-col-center gap-4">
  <div class="flex-col-center rounded-2xl bg-black/50 p-4">
    <p>Submissions:</p>
    <Button onclick={() => (promise = fetchSubmissions())}>Fetch Submissions</Button>
    {let percentage = (votes.length / (submissions.length || 1)) * 100}
    <span class="w-64 rounded-2xl bg-gray-500">
      <span class="rounded-2xl bg-green-500 text-center" style="width: {percentage}%; display: inline-block;"><p class="px-4">{percentage.toFixed(1)}%</p></span>
    </span>
    <div class="flex-row-center gap-2">
      <Button onclick={() => (currentPage = Math.max(currentPage - 1, 1))}>&lt; Page {currentPage - 1}</Button>
      <p>Currently showing {currentlyShowingSubmissions.length}/{submissions.length} submissions</p>
      <Button onclick={() => (currentPage = currentPage + 1)}>Page {currentPage + 1} &gt;</Button>
    </div>
    
  </div>
  {#await promise}
    <div>Loading submissions...</div>
  {:then}
    <div>
      {#each currentlyShowingSubmissions as submission, index (submission.id)}
        <JudgeMap
          sortedSubmission={submission}
          bsAPI={bsAPIData[submission.bsrId!]}
          vote={votes.find((vote) => vote.submissionId === submission.id)}
          onVote={(vote) => {
            const existingIndex = votes.findIndex((v) => v.submissionId === submission.id);
            if (existingIndex !== -1) {
              votes[existingIndex] = vote;
            } else {
              votes = [...votes, vote];
            }
          }}
          enableButtons={judge.roles.includes("judge")}
        />
      {/each}
    </div>
  {/await}
</div>
