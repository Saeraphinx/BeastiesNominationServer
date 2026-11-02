<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import type { BSMap, BSPlaylist, BSUser } from "../../../../lib/shared/beatsaverTypes.js";
  import { getBeatSaverMaps, getBeatSaverPlaylists, getBeatSaverUsers, getSortedSubmissions, getVotes } from "../../../api/judging.remote.js";
  import { getSubmissions } from "../../../api/sorting.remote.js";
  import type { JudgeVote, SortedSubmission } from "../../../../lib/server/database.js";
  import JudgeMap from "../../../../lib/components/maps/JudgeMap.svelte";
  import Button from "../../../../lib/components/common/Button.svelte";
  import { getPlaylist } from "../../../../lib/shared/getMap.js";
  import { SortedSubmissionsCategory } from "../../../../lib/shared/goodies.js";
  import { onMount } from "svelte";

  const { data: _internal } = $props();
  const { pageData, judge } = $derived(_internal);

  let bsAPIMapData: Record<string, BSMap> = $state({});
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

  $effect(() => {
    let mapIdsToFind = [];
    let userIdsToFind = [];
    let playlistIdsToFind = [];

    for (const submission of currentlyShowingSubmissions) {
      if (submission.bsrId && !bsAPIMapData[submission.bsrId]) {
        mapIdsToFind.push(submission.bsrId);
      }
      if (submission.name && submission.name.match(/^\d+$/) && submission.category != SortedSubmissionsCategory.PackOfTheYear && submission.category != SortedSubmissionsCategory.OST && !bsAPIUserData[submission.name]) {
        userIdsToFind.push(submission.name);
      }
      if (submission.name && submission.name.match(/^\d+$/) && submission.category == SortedSubmissionsCategory.PackOfTheYear && !bsAPIPlaylistData[submission.name]) {
        playlistIdsToFind.push(submission.name);
      }
    }

    if (mapIdsToFind.length > 0) {
      getBeatSaverMaps(mapIdsToFind).then((maps) => {
        bsAPIMapData = { ...bsAPIMapData, ...Object.fromEntries(maps.map((map) => [map.id, map])) };
      });
    }
    if (userIdsToFind.length > 0) {
      getBeatSaverUsers(userIdsToFind).then((users) => {
        bsAPIUserData = { ...bsAPIUserData, ...Object.fromEntries(users.map((user) => [user.id.toString(), user])) };
      });
    }
    if (playlistIdsToFind.length > 0) {
      getBeatSaverPlaylists(playlistIdsToFind).then((playlists) => {
        bsAPIPlaylistData = { ...bsAPIPlaylistData, ...Object.fromEntries(playlists.map((playlist) => [playlist.playlist.playlistId.toString(), playlist])) };
      });
    }
  });

  let isLoading = $state(false);
  async function fetchSubmissions() {
    isLoading = true;
    const getSub = getSortedSubmissions({
      category: pageData.category,
    });
    await getSub.refresh();
    submissions = await getSub;
    isLoading = false;
  }
  onMount(async () => {
    await fetchSubmissions();
  });
</script>

<div class="flex-col-center gap-4">
  <div class="flex-col-center rounded-2xl bg-black/50 p-4 gap-1">
    <p>Submissions:</p>
    <Button onclick={async () => await fetchSubmissions()} disabled={isLoading}>{isLoading ? 'Loading...' : 'Fetch Submissions'}</Button>
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
    <div class="flex-row-center flex-wrap gap-2">
      {#each currentlyShowingSubmissions as submission, index (submission.id)}
        <JudgeMap
          sortedSubmission={submission}
          bsAPI={bsAPIMapData[submission.bsrId!]}
          bsAPIUser={bsAPIUserData[submission.name!]}
          bsAPIPlaylist={bsAPIPlaylistData[submission.name!]}
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
</div>
