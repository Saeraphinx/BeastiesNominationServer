<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import type { BSMap, BSPlaylist, BSUser } from "../../../../lib/shared/beatsaverTypes.js";
  import { getBeatSaverMaps, getBeatSaverUsers, getSortedSubmissions, getVotes } from "../../../api/judging.remote.js";
  import { getSubmissions } from "../../../api/sorting.remote.js";
  import type { JudgeVote, SortedSubmission } from "../../../../lib/server/database.js";
  import JudgeMap from "../../../../lib/components/maps/JudgeMap.svelte";
  import Button from "../../../../lib/components/common/Button.svelte";
  import { getPlaylist } from "../../../../lib/shared/getMap.js";

  const { data: _internal } = $props();
  const { pageData, judge } = $derived(_internal);

  let bsAPIData: Record<string, BSMap> = $state({});
  let bsAPIUserData: Record<string, BSUser> = $state({});
  let bsAPIPlaylistData: Record<string, BSPlaylist> = $state({});
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
    const userIds = submissions.filter(e => e.name && e.name.match(/\d+/) && !e.category.includes(`Pack`) && !e.category.includes(`OST`) ).map(submission => submission.name as string);
    const playlistIds = submissions.filter(e => e.name && e.name.match(/\d+/) && e.category.includes(`Pack`)).map(submission => submission.name as string);

    bsAPIData = Object.fromEntries((await getBeatSaverMaps(mapIds)).map(map => [map.id, map]));
    bsAPIUserData = Object.fromEntries((await getBeatSaverUsers(userIds)).map(user => [user.id, user]));
    bsAPIPlaylistData = Object.fromEntries((await Promise.all(playlistIds.map(id => getPlaylist(id)))).map(playlist => [playlist.playlist.playlistId, playlist]));
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
          bsAPIUser={bsAPIUserData[submission.name ?? ``]}
          bsAPIPlaylist={bsAPIPlaylistData[submission.name ?? ``]}
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
