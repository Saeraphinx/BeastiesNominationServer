<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import type { Submission } from "../../server/database";
  import type { BSMap } from "../../shared/beatsaverTypes";
  import MapBase from "./MapBase.svelte";
  import Button from "../common/Button.svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { CharacteristicEnum, DifficultyEnum, isDiffCharRequiredSortedSubmission, isNameRequiredSortedSubmission, SortedSubmissionsCategory } from "../../shared/goodies";
  import { approveSubmission } from "../../../routes/api/sorting.remote";
  import { fade, fly } from "svelte/transition";
  import { toast } from "svelte-sonner";
  import { includes } from "zod";
  import Dialog from "../common/Dialog.svelte";

  let props: {
    submission: InferAttributes<Submission>;
    bsAPI?: BSMap;
    onApprove?: (response: { submission: InferAttributes<Submission>; duplicates: number; duplicateIds: number[] }) => void;
    onReject?: () => void;
  } & HTMLAttributes<HTMLDivElement> = $props();

  let divProps = $derived.by(() => {
    const { submission, bsAPI, ...rest } = props;
    return rest;
  });

  let subText = $derived.by(() => {
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

  let showSubmissionDialog = $state(false);
  function showSortDialog() {
    showSubmissionDialog = true;
    approveSubmission.fields.category.set(props.submission.category as any);
    approveSubmission.fields.submissionId.set(props.submission.nominationId);
    approveSubmission.fields.characteristic.set(props.submission.characteristic as any);
    approveSubmission.fields.difficulty.set(props.submission.difficulty as any);
    approveSubmission.fields.accepted.set(true);
  }
</script>

<MapBase category={props.submission.category} map={props.bsAPI} characteristic={props.submission.characteristic} difficulty={props.submission.difficulty} {subText} {...divProps}>
  <p class="w-[50%] text-center">{props.submission.category}</p>
  <span class="h-8 w-0.5 rounded bg-white/20"></span>
  <div class="flex w-[50%] flex-row justify-center gap-2">
    <Button class="w-20 border-2 border-green-600" onclick={showSortDialog}>Approve</Button>
    <Button class="w-20 border-2 border-red-600" onclick={() => props.onReject?.()}>Reject</Button>
  </div>
</MapBase>

<Dialog bind:showDialog={showSubmissionDialog}>
    <form
    onclick={(e) => e.stopPropagation()} role="presentation"
      class="flex flex-col rounded-lg bg-black/90 p-4 [&>label]:text-lg [&>label]:font-bold"
      {...approveSubmission.enhance(async (form) => {
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
        }
      })}
    >
      <p class="text-lg font-bold">Submission Details for {props.submission.nominationId}</p>
      <MapBase category={props.submission.category} map={props.bsAPI} characteristic={props.submission.characteristic} difficulty={props.submission.difficulty} {subText} />
      <div class="mt-4 grid grid-cols-2 gap-2">
        <input {...approveSubmission.fields.submissionId.as(`hidden`, props.submission.nominationId)} />
        <input {...approveSubmission.fields.accepted.as(`hidden`, true)} />
        <label for="category">Category</label>
        <select id="category" {...approveSubmission.fields.category.as(`select`, props.submission.category)}>
          {#each Object.values(SortedSubmissionsCategory) as category}
            <option value={category}>{category}</option>
          {/each}
        </select>

        {let selectedCategory = $derived.by(approveSubmission.fields.category.value)}{#if selectedCategory && selectedCategory.includes(`Ranked`)}
          <label for="doubleRankedCategory">Second Category</label>
          <select id="doubleRankedCategory" {...approveSubmission.fields.doubleRankedCategory.as(`select`, ``)}>
            {#each Object.values(SortedSubmissionsCategory).filter((c) => c.includes(`Ranked`)) as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        {/if}

        {#if selectedCategory && isNameRequiredSortedSubmission(selectedCategory)}
          <label for="name">Name</label>
          <input id="name" type="text" {...approveSubmission.fields.name.as(`text`, props.submission.name ?? "")} />
        {:else}
          <label for="bsrId">BSR ID</label>
          <input id="bsrId" type="text" {...approveSubmission.fields.bsrId.as(`text`, props.submission.bsrId ?? "")} />
          {#if selectedCategory && isDiffCharRequiredSortedSubmission(selectedCategory)}
            <label for="difficulty">Difficulty</label>
            <select id="difficulty" {...approveSubmission.fields.difficulty.as(`select`, props.submission.difficulty ?? "")}>
              {#each Object.values(DifficultyEnum) as difficulty}
                <option value={difficulty}>{difficulty}</option>
              {/each}
            </select>
            <label for="characteristic">Characteristic</label>
            <select id="characteristic" {...approveSubmission.fields.characteristic.as(`select`, props.submission.characteristic ?? "")}>
              {#each Object.values(CharacteristicEnum) as characteristic}
                <option value={characteristic}>{characteristic}</option>
              {/each}
            </select>
          {/if}
        {/if}
        <button type="button" class="rounded-lg border-2 border-gray-600 p-2" onclick={() => (showSubmissionDialog = false)}>Cancel</button>
        <button type="submit" class="rounded-lg border-2 border-green-600 p-2">Save</button>
      </div>
    </form>
</Dialog>
