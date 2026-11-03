<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import { onMount } from "svelte";
  import type { Judge } from "../../../lib/server/database";
  import { deleteSortedSubmission, editUserRole, getUsers, moveSubmission, resetVotes, setUserBSId, setUserCategories, updateNullValues } from "./admin.remote";
  import Button from "../../../lib/components/common/Button.svelte";
  import { toast } from "svelte-sonner";
  import { flip } from "svelte/animate";
  import Dialog from "../../../lib/components/common/Dialog.svelte";
  import { SortedSubmissionsCategory } from "../../../lib/shared/goodies";
  import { m } from "../../../lib/paraglide/messages";
  import type { ClassValue } from "svelte/elements";

  let judges: InferAttributes<Judge>[] = $state([]);
  onMount(async () => {
    await refreshJudges();
  });

  async function refreshJudges() {
    const users = getUsers();
    await users.refresh();
    judges = await users;
  }

  async function editJudgeRoles(judgeId: number, role: "sort" | "judge", addOrRemove: "add" | "remove") {
    await editUserRole({ judgeId, role, addOrRemove });
    await refreshJudges();
    toast.success(`User role "${role}" ${addOrRemove === "add" ? "added" : "removed"} successfully.`);
    //return judge;
  }

  let showCategoriesDialog = $state(false);
  let selectedJudgeId: number | null = $state(null);
  function openCategoriesDialog(judgeId: number) {
    selectedJudgeId = judgeId;
    showCategoriesDialog = true;
  }
</script>

<div class="flex-col-center gap-2">
  boo
  <div class="flex-col-center w-full rounded-2xl bg-black/50 px-8 pt-2">
    <table class="mx-8 prose min-w-full prose-invert">
      <thead>
        <tr>
          <th></th>
          <th>ID</th>
          <th>Name</th>
          <th>Roles</th>
          <th>BeatSaver IDs</th>
          <th>Categories</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each judges as judge (judge.id)}
          <tr>
            <td class="not-prose"><img src={judge.avatarUrl} class="h-6 w-6 rounded-full" alt="Judge Avatar" /></td>
            <td>{judge.id}</td>
            <td>{judge.name}</td>
            <td>{judge.roles.join(", ")}</td>
            <td>{judge.beatSaverIds.join(", ")}</td>
            <td>{judge.permittedCategories.map((category) => m[`common.sortedCategories.${category as SortedSubmissionsCategory}.dropdown`]()).join(", ")}</td>
            <td>
              {#if judge.roles.includes("judge")}
                <Button onclick={async () => await editJudgeRoles(judge.id, "judge", "remove")}>Remove Judge</Button>
              {:else}
                <Button onclick={async () => await editJudgeRoles(judge.id, "judge", "add")}>Add Judge</Button>
              {/if}
              {#if judge.roles.includes("sort")}
                <Button onclick={async () => await editJudgeRoles(judge.id, "sort", "remove")}>Remove Sort</Button>
              {:else}
                <Button onclick={async () => await editJudgeRoles(judge.id, "sort", "add")}>Add Sort</Button>
              {/if}
              <Button onclick={() => openCategoriesDialog(judge.id)}>Edit Categories</Button>
            </td>
          </tr>
        {/each}
      </tbody>
      {#if judges.length === 0}
        <tfoot>
          <tr>
            <td colspan="6" class="text-center">No judges found.</td>
          </tr>
        </tfoot>
      {/if}
    </table>
  </div>
  <div class="grid grid-flow-dense grid-cols-2 flex-wrap gap-2">
    {const oneShotClass: ClassValue = `flex-col-center rounded-2xl bg-black/50 p-4 gap-2 max-w-lg`}
    {const oneShotTextClass: ClassValue = `flex-col-center text-wrap text-center`}
    <div class={oneShotClass} id="reset-votes">
      <div class={oneShotTextClass}>
        <p class="text-2xl/tight">Reset Votes for Category</p>
        <p class="text-gray-300">Resets all votes within a specifc category. Optionally, you can target a specific judge. This does not delete their notes.</p>
      </div>
      {let resetVotesCategory = $state("")}
      {let resetVotesJudgeId = $state("")}
      <div class="grid grid-cols-2 gap-2">
        <label for="category-select">Category:</label>
        <select id="category-select" bind:value={resetVotesCategory}>
          {#each Object.values(SortedSubmissionsCategory) as category}
            <option value={category}>{m[`common.sortedCategories.${category as SortedSubmissionsCategory}.dropdown`]()}</option>
          {/each}
        </select>
        <label for="judge-select">Judge:</label>
        <select id="judge-select" bind:value={resetVotesJudgeId}>
          {#each judges as judge}
            <option value={judge.id}>{judge.name}</option>
          {/each}
        </select>
      </div>
      <Button
        onclick={async () => {
          if (resetVotesCategory) {
            const result = await resetVotes({ category: resetVotesCategory, judgeId: parseInt(resetVotesJudgeId) });
            toast.success(`Reset ${result.count} votes for category ${resetVotesCategory}.`);
          }
        }}>Reset Votes</Button
      >
    </div>
    <div class={oneShotClass} id="move-submission">
      {let moveSubmissionSubmissionId = $state("")}
      {let moveSubmissionNewCategory = $state("")}
      <div class={oneShotTextClass}>
        <p class="text-2xl/tight">Move Submission</p>
        <p class="text-gray-300">Move a submission to a different category. This <b>does</b> delete judge votes and notes for the selected submission.</p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <label for="submission-id-input">Sorted Submission ID</label>
        <input id="submission-id-input" type="text" placeholder="Enter submission ID" bind:value={moveSubmissionSubmissionId} />
        <label for="new-category-select">New Category</label>
        <select id="new-category-select" bind:value={moveSubmissionNewCategory}>
          {#each Object.values(SortedSubmissionsCategory) as category}
            <option value={category}>{m[`common.sortedCategories.${category as SortedSubmissionsCategory}.dropdown`]()}</option>
          {/each}
        </select>
      </div>
      <Button
        onclick={async () => {
          if (moveSubmissionSubmissionId) {
            const result = await moveSubmission({ submissionId: parseInt(moveSubmissionSubmissionId), newCategory: moveSubmissionNewCategory as SortedSubmissionsCategory });
            toast.success(`Moved submission ${moveSubmissionSubmissionId} successfully.`);
          }
        }}>Move Submission</Button>
    </div>
    <div class={oneShotClass} id="delete-sorted-submission">
      {let deleteSubmissionId = $state("")}
      <div class={oneShotTextClass}>
        <p class="text-2xl/tight">Delete Sorted Submission</p>
        <p class="text-gray-300">Delete a sorted submission by its ID. This will also remove all associated votes.</p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <label for="ds-submission-id-input">Sorted Submission ID</label>
        <input id="ds-submission-id-input" type="text" placeholder="Submission ID" bind:value={deleteSubmissionId} />
      </div>
      <Button
        onclick={async () => {
          if (deleteSubmissionId && !isNaN(parseInt(deleteSubmissionId))) {
            const result = await deleteSortedSubmission({ submissionId: parseInt(deleteSubmissionId) });
            if (result.error) {
              toast.error(result.error);
            } else {
              toast.success(`Deleted submission ${deleteSubmissionId} successfully.`);
            }
          }
        }}>Delete Submission</Button>
    </div>
    <div class={oneShotClass} id="set-user-beatsaver-ids">
      {let bsIdJudgeId = $state("")}
      {let bsIds = $state("")}
      <div class={oneShotTextClass}>
        <p class="text-2xl/tight">Set User BeatSaver IDs</p>
        <p class="text-gray-300">Set the BeatSaver IDs for a specific judge.</p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <label for="judge-select">Judge:</label>
        <select id="judge-select" bind:value={bsIdJudgeId}>
          {#each judges as judge}
            <option value={judge.id}>{judge.name}</option>
          {/each}
        </select>
        <label for="bs-ids-input">BeatSaver IDs (comma separated)</label>
        <input id="bs-ids-input" type="text" placeholder="BeatSaver IDs" bind:value={bsIds} />
      </div>
      <Button
        onclick={async () => {
            let judge = judges.find(j => j.id === parseInt(bsIdJudgeId));
            if (!judge) {
              toast.error(`Judge with ID ${bsIdJudgeId} not found.`);
              return;
            }
            bsIds = judge.beatSaverIds.join(",");
        }}>Load BeatSaver IDs</Button>
      <Button
        onclick={async () => {
          if (bsIdJudgeId && !isNaN(parseInt(bsIdJudgeId)) && (bsIds.split(",").map(id => id.trim())).every(id => !isNaN(parseInt(id)))) {
            const result = await setUserBSId({ judgeId: parseInt(bsIdJudgeId), bsId: bsIds.split(",").map(id => id.trim()) });
            if (`error` in result) {
              toast.error(result.error);
            } else {
              await refreshJudges();
              toast.success(`Set BeatSaver IDs for judge ${bsIdJudgeId} successfully.`);
            }
          }
        }}>Set BeatSaver IDs</Button>
    </div>
    <div class={oneShotClass} id="update-null-values">
      <div class={oneShotTextClass}>
        <p class="text-2xl/tight">Update Null Values</p>
        <p class="text-gray-300">Update all submissions that have null hash values by fetching the latest data from BeatSaver.</p>
      </div>
      <Button
        onclick={async () => {
          const result = await updateNullValues();
          toast.success(`Updated ${result.updatedCount} submissions with null values.`);
        }}>Update Null Values</Button>
    </div>
    <div class={oneShotClass} id="run-involved-check">
      <div class={oneShotTextClass}>
        <p class="text-2xl/tight">Run Involved Check</p>
        <p class="text-gray-300">Check all submissions for involved mappers and update accordingly. This will not change votes of judges who have already voted.</p>
      </div>
      <Button
        onclick={async () => {
          //const result = await runInvolvedCheck();
          toast.success(`Involved check completed successfully.`);
        }}>Run Involved Check</Button
      >
    </div>
  </div>
</div>

<!-- svelte-ignore state_referenced_locally -->
<Dialog bind:showDialog={showCategoriesDialog}>
  <div class="w-full max-w-xl bg-black/90" role="presentation" onclick={(e) => e.stopPropagation()}>
    {let selectedJudge = $derived(judges.find((j) => j.id === selectedJudgeId))}
    {let selectedCategories = $state(selectedJudge?.permittedCategories ?? [])}
    <p class="m-2 text-2xl">Edit categories for {selectedJudge?.name}</p>
    <div class="flex-row-center flex-wrap gap-2">
      {#each Object.values(SortedSubmissionsCategory) as category}
        {let isSelected = $derived(selectedCategories.includes(category))}
        <Button
          class={isSelected ? "bg-green-500" : "bg-gray-800"}
          onclick={async (e) => {
            e.stopPropagation();
            if (isSelected) {
              selectedCategories = selectedCategories.filter((c) => c !== category);
            } else {
              selectedCategories = [...selectedCategories, category];
            }
          }}
        >
          {category}
        </Button>
      {/each}
    </div>
    <div class="flex-row-center {selectedJudge ? `visible` : `invisible`} my-2 gap-4">
      <Button class="bg-white/10" onclick={() => (showCategoriesDialog = false)}>Close</Button>
      <Button
        class="bg-white/10"
        onclick={async () => {
          await setUserCategories({ judgeId: selectedJudge?.id ?? -1, categories: selectedCategories });
          showCategoriesDialog = false;
          toast.success("Categories updated successfully.");
          await refreshJudges();
        }}>Save</Button
      >
    </div>
  </div>
</Dialog>
