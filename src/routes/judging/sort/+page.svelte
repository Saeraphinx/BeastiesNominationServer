<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import type { Submission } from "../../../lib/server/database";
  import { getSubmissions } from "../../api/sorting.remote";
  import SortMap from "../../../lib/components/maps/SortMap.svelte";
  import type { BSMap, BSUser, BSPlaylist } from "../../../lib/shared/beatsaverTypes";
  import { getBulkMaps, getPlaylist } from "../../../lib/shared/getMap";
  import { getBeatSaverMaps, getBeatSaverPlaylists, getBeatSaverUsers } from "../../api/judging.remote";
  import Button from "../../../lib/components/common/Button.svelte";
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";
  import { SubmissionCategory } from "../../../lib/shared/goodies";
  import { toast } from "svelte-sonner";
  import { onMount } from "svelte";

  let bsAPIMapData: Record<string, BSMap> = $state({});
  let bsAPIUserData: Record<string, BSUser> = $state({});
  let bsAPIPlaylistData: Record<string, BSPlaylist> = $state({});
  let submissions: InferAttributes<Submission>[] = $state([]);
  let currentCategory = $state("All");
  let currentPage = $state(1);
  let currentlyShowingSubmissions: InferAttributes<Submission>[] = $derived.by(() => {
    let submissionsToLookAt = submissions.filter((s) => s.category == currentCategory || currentCategory == "All");
    const start = (currentPage - 1) * 25;
    const end = start + 25;
    console.log("Currently showing submissions from index", start, "to", end);

    let ret = submissionsToLookAt.slice(start, end);
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
      if (submission.name && submission.name.match(/^\d+$/) && submission.category != SubmissionCategory.PackOfTheYear && submission.category != SubmissionCategory.OST && !bsAPIUserData[submission.name]) {
        userIdsToFind.push(submission.name);
      }
      if (submission.name && submission.name.match(/^\d+$/) && submission.category == SubmissionCategory.PackOfTheYear && !bsAPIPlaylistData[submission.name]) {
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
        bsAPIUserData = { ...bsAPIUserData, ...Object.fromEntries(users.map((user) => [user.id, user])) };
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
    const getSubs = getSubmissions({ category: currentCategory == "All" ? undefined : currentCategory });
    await getSubs.refresh();
    submissions = await getSubs;

    // let mapIds = submissions.map(submission => submission.bsrId!).filter(Boolean);
    // let userIds = submissions.filter(e => e.name && e.name.match(/^\d+$/) && e.category != SubmissionCategory.PackOfTheYear && e.category != SubmissionCategory.OST ).map(submission => submission.name as string);
    // let playlistIds = submissions.filter(e => e.name && e.name.match(/^\d+$/) && e.category == SubmissionCategory.PackOfTheYear).map(submission => submission.name as string);
    isLoading = false;
  }

  onMount(async () => await fetchSubmissions());
</script>

<div class="mb-24 flex flex-col items-center justify-center gap-4">
  <div class="flex-col-center gap-2 rounded-2xl bg-black/50 p-4">
    <p>Submissions:</p>
    <Button onclick={async () => await fetchSubmissions()} disabled={isLoading}>{isLoading ? `Fetching...` : `Fetch Submissions`}</Button>
    <select bind:value={currentCategory}>
      <option value="All">All</option>
      {#each Object.values(SubmissionCategory) as category}
        <option value={category}>{category}</option>
      {/each}
    </select>
    <div class="flex-row-center gap-2">
      <Button onclick={() => (currentPage = Math.max(currentPage - 1, 1))}>&lt; Page {currentPage - 1}</Button>
      <p>Currently showing {currentlyShowingSubmissions.length}/{submissions.length} submissions</p>
      <Button onclick={() => (currentPage = currentPage + 1)}>Page {currentPage + 1} &gt;</Button>
    </div>
  </div>
  <div class="flex flex-row flex-wrap items-center justify-center gap-4">
    {#each currentlyShowingSubmissions as submission (submission.nominationId)}
      <span out:fade={{ duration: 300 }} animate:flip={{ duration: 300 }}>
        <SortMap
          {submission}
          bsAPI={bsAPIMapData[submission.bsrId!]}
          bsAPIUser={bsAPIUserData[submission.name!]}
          bsAPIPlaylist={bsAPIPlaylistData[submission.name!]}
          onApprove={(res) => fetchSubmissions()}
          onReject={(res) => fetchSubmissions()}
        />
      </span>
    {/each}
  </div>
</div>
