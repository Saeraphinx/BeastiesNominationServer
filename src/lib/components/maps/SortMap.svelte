<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import type { Submission } from "../../server/database";
  import type { BSMap, BSUser, BSPlaylist } from "../../shared/beatsaverTypes";
  import MapBase from "./MapBase.svelte";
  import Button from "../common/Button.svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { CharacteristicEnum, DifficultyEnum, isDiffCharRequiredSortedSubmission, isNameRequired, isNameRequiredSortedSubmission, SortedSubmissionsCategory } from "../../shared/goodies";
  import { approveSubmission, rejectSubmission } from "../../../routes/api/sorting.remote";
  import { toast } from "svelte-sonner";
  import Dialog from "../common/Dialog.svelte";
  import { m } from "../../paraglide/messages";

  let props: {
    submission: InferAttributes<Submission>;
    bsAPI?: BSMap;
    bsAPIUser?: BSUser;
    bsAPIPlaylist?: BSPlaylist;
    onApprove?: (response: { submission: InferAttributes<Submission>; duplicates: number; duplicateIds: number[] }) => void;
    onReject?: (response: { submission: InferAttributes<Submission>; duplicates: number; duplicateIds: number[] }) => void;
  } & HTMLAttributes<HTMLDivElement> = $props();

  let divProps = $derived.by(() => {
    const { submission, bsAPI, ...rest } = props;
    return rest;
  });

  let isLoading = $state(false);

  let subText = $derived.by(() => {
    if (isNameRequired(props.submission.category) && !props.submission.category.includes(`Pack`) && !props.submission.category.includes(`OST`)) {
        return `${props.submission.name ?? "Unnamed Submission"} | ${props.bsAPIUser?.stats?.firstUpload ?? "Unknown Upload Date"}`;
    } else if (props.submission.category.includes(`Pack`)) {
        return `${props.submission.name ?? "Unnamed Submission"} | ${props.bsAPIPlaylist?.playlist.createdAt ?? "Unknown Playlist"}`;
    } else if (props.submission.category.includes(`OST`)) {
        return ``;
    }
    let text = `${props.bsAPI?.id}`;
    if (props.submission.category.startsWith(`Ranked`)) {
      let selectedDiff = props.bsAPI?.versions[0].diffs.find((diff) => diff.characteristic === props.submission.characteristic && diff.difficulty === props.submission.difficulty);
      text = `${text} | BL: ${selectedDiff?.blStars ?? "N/A"}★ | SS: ${selectedDiff?.stars ?? "N/A"}★`;
    } else if (props.submission.category.startsWith(`Mods`)) {
      let selectedDiff = props.bsAPI?.versions[0].diffs.find((diff) => diff.characteristic === props.submission.characteristic && diff.difficulty === props.submission.difficulty);
      text = `${text} | NE: ${selectedDiff?.ne ?? "No"} | Chroma: ${selectedDiff?.chroma ?? "no"}`;
    } else {
      text = `${text} | ${new Date(props.bsAPI?.uploaded ?? 0).toLocaleDateString()}`;
    }
    return text;
  });
  let customData = $derived.by(() => {
    if (!isNameRequired(props.submission.category)) {
      return undefined;
    }

    if (props.bsAPIUser) {
      return {
        name: props.bsAPIUser?.name ?? "Unknown User",
        icon: props.bsAPIUser?.avatar,
        link: `https://beatsaver.com/profile/${props.bsAPIUser?.id}`
      };
    } else if (props.bsAPIPlaylist) {
      return {
        name: props.bsAPIPlaylist?.playlist.name ?? "Unknown Playlist",
        icon: props.bsAPIPlaylist?.playlist.playlistImage512,
        link: `https://beatsaver.com/playlist/${props.bsAPIPlaylist?.playlist.playlistId}`
      };
    } else {
        return {
          name: props.submission.name ?? "Unnamed Submission",
          icon: undefined,
          link: "#"
        };
    }
  });

  let showSubmissionDialog = $state(false);
  function showSortDialog() {
    showSubmissionDialog = true;
    approveSubmission.fields.name.set(props.submission.name ?? undefined);
    approveSubmission.fields.category.set(props.submission.category as any);
    approveSubmission.fields.doubleRankedCategory.set(undefined);
    approveSubmission.fields.submissionId.set(props.submission.nominationId);
    approveSubmission.fields.characteristic.set(props.submission.characteristic as any);
    approveSubmission.fields.difficulty.set(props.submission.difficulty as any);
  }
</script>

<MapBase category={props.submission.category} map={props.bsAPI} custom={customData} characteristic={props.submission.characteristic} difficulty={props.submission.difficulty} {subText} {...divProps}>
  {#if isLoading}
    <div class="absolute inset-0 w-full h-full bg-black/50">
      <div class="flex items-center justify-center h-full">
        <span class="text-white">Loading...</span>
      </div>
    </div>
  {/if}
  <p class="w-[50%] text-center text-base/4">
    {m[`common.category.${props.submission.category}.dropdown`]()}
    <br>
    <span class="text-white/80 text-xs/tight">
      {props.submission.service}:{props.submission.submitterId}
    </span>
  </p>
  <span class="h-8 w-0.5 rounded bg-white/20"></span>
  <div class="flex w-[50%] flex-row justify-center gap-2">
    <Button class="w-20 border-2 border-green-600" disabled={isLoading} onclick={showSortDialog}>Approve</Button>
    <Button class="w-20 border-2 border-red-600" disabled={isLoading} onclick={async () => {
      isLoading = true;
      const result = await rejectSubmission({ submissionId: props.submission.nominationId });
      if (`error` in result) {
        toast.error(`Failed to reject submission: ${result.error}`);
      } else {
        toast.success(`Submission ${props.submission.nominationId} rejected successfully.`, {
          description: `${result?.duplicates} duplicate(s) found.`,
        });
        props.onReject?.({ submission: result.submission, duplicates: result.duplicates, duplicateIds: result.duplicateIds });
      }
      isLoading = false;
    }}>Reject</Button>
  </div>
</MapBase>

<Dialog bind:showDialog={showSubmissionDialog}>
    <form
    onclick={(e) => e.stopPropagation()} role="presentation"
      class="flex flex-col rounded-lg bg-black/75 backdrop-blur-md p-4 [&>label]:text-lg [&>label]:font-bold"
      {...approveSubmission.enhance(async (form) => {
        isLoading = true;
        if (await approveSubmission.submit()) {
          if (form.result?.error) {
            toast.error("Failed to approve submission.", {
              description: `${form.result.error}`,
            });
          } else {
            if (!form.result || !form.result.submission) {
                toast.error("Failed to approve submission.", {
                  description: `No result returned from the server.`,
                });
            }
            showSubmissionDialog = false;
            toast.success("Submission approved.", {
              description: `${form.result?.duplicates} duplicate(s) found.`,
            });
            // @ts-ignore
            props.onApprove?.(form.result);
          }
        isLoading = false;
        }
      })}
    >
      <p class="text-lg font-bold">Submission Details for {props.submission.nominationId}</p>
      <MapBase category={props.submission.category} custom={customData} map={props.bsAPI} characteristic={props.submission.characteristic} difficulty={props.submission.difficulty} {subText} onclick={(e) => {
            e.stopPropagation()
            e.preventDefault()
        }} />
      <div class="mt-4 grid grid-cols-2 gap-2">
        <input {...approveSubmission.fields.submissionId.as(`hidden`, props.submission.nominationId)} />
        <label for="category">Category</label>
        <select id="category" disabled={isLoading} {...approveSubmission.fields.category.as(`select`, props.submission.category)}>
          {#each Object.values(SortedSubmissionsCategory) as category}
            <option value={category}>{category}</option>
          {/each}
        </select>

        {let selectedCategory = $derived.by(approveSubmission.fields.category.value)}{#if selectedCategory && selectedCategory.includes(`Ranked`)}
          <label for="doubleRankedCategory">Second Category</label>
          <select id="doubleRankedCategory" disabled={isLoading} {...approveSubmission.fields.doubleRankedCategory.as(`select`, ``)}>
            {#each Object.values(SortedSubmissionsCategory).filter((c) => c.includes(`Ranked`)) as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        {/if}

        {#if selectedCategory && isNameRequiredSortedSubmission(selectedCategory)}
          <label for="name">ID</label>
          <input id="name" type="text" disabled={isLoading} {...approveSubmission.fields.name.as(`text`, props.submission.name ?? "")} />
        {:else}
          <label for="bsrId">BSR ID</label>
          <input id="bsrId" type="text" disabled={isLoading} {...approveSubmission.fields.bsrId.as(`text`, props.submission.bsrId ?? "")} />
          {#if selectedCategory && isDiffCharRequiredSortedSubmission(selectedCategory)}
            <label for="difficulty">Difficulty</label>
            <select id="difficulty" disabled={isLoading} {...approveSubmission.fields.difficulty.as(`select`, props.submission.difficulty ?? "")}>
              {#each Object.values(DifficultyEnum) as difficulty}
                <option value={difficulty}>{difficulty}</option>
              {/each}
            </select>
            <label for="characteristic">Characteristic</label>
            <select id="characteristic" disabled={isLoading} {...approveSubmission.fields.characteristic.as(`select`, props.submission.characteristic ?? "")}>
              {#each Object.values(CharacteristicEnum) as characteristic}
                <option value={characteristic}>{characteristic}</option>
              {/each}
            </select>
          {/if}
        {/if}
        <button type="button" class="rounded-lg border-2 border-gray-600 p-2" disabled={isLoading} onclick={() => (showSubmissionDialog = false)}>Cancel</button>
        <button type="submit" class="rounded-lg border-2 border-green-600 p-2" disabled={isLoading}>Save</button>
      </div>
    </form>
</Dialog>
