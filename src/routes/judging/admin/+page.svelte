<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import { onMount } from "svelte";
  import type { Judge } from "../../../lib/server/database";
  import { editUserRole, getUsers, moveSubmission, resetVotes, setUserCategories, updateNullValues } from "./admin.remote";
  import Button from "../../../lib/components/common/Button.svelte";
  import { toast } from "svelte-sonner";
  import { flip } from "svelte/animate";
  import Dialog from "../../../lib/components/common/Dialog.svelte";
  import { SortedSubmissionsCategory } from "../../../lib/shared/goodies";
  import { m } from "../../../lib/paraglide/messages";
  import type { ClassValue } from "svelte/elements";

  let judges: InferAttributes<Judge>[] = $state([]);
  onMount(async () => {
    judges = await getUsers();
  });

  async function editJudgeRoles(judgeId: number, role: "sort" | "judge", addOrRemove: "add" | "remove") {
    await editUserRole({ judgeId, role, addOrRemove });
    judges = await getUsers();
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

<div class="flex-col-center">
  boo
  <div class="flex-col-center rounded-2xl bg-black/50 px-8 py-2">
    <table class="prose max-w-3xl prose-invert">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Roles</th>
          <th class="w-xl">Categories</th>
          <th class="w-lg">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#key judges}
          {#each judges as judge}
            {let isJudge = $derived(judge.roles.includes("judge"))}
            {let isSort = $derived(judge.roles.includes("sort"))}
            <tr>
              <td>{judge.id}</td>
              <td>{judge.name}</td>
              <td>{judge.roles.join(", ")}</td>
              <td>{judge.permittedCategories.map((category) => m[`common.sortedCategories.${category as SortedSubmissionsCategory}.dropdown`]()).join(", ")}</td>
              <td>
                {#if isJudge}
                  <Button onclick={async () => await editJudgeRoles(judge.id, "judge", "remove")}>Remove Judge</Button>
                {:else}
                  <Button onclick={async () => await editJudgeRoles(judge.id, "judge", "add")}>Add Judge</Button>
                {/if}
                {#if isSort}
                  <Button onclick={async () => await editJudgeRoles(judge.id, "sort", "remove")}>Remove Sort</Button>
                {:else}
                  <Button onclick={async () => await editJudgeRoles(judge.id, "sort", "add")}>Add Sort</Button>
                {/if}
                <Button onclick={() => openCategoriesDialog(judge.id)}>Edit Categories</Button>
              </td>
            </tr>
          {/each}
        {/key}
      </tbody>
    </table>
  </div>
  <div class="m-4 grid grid-cols-2 grid-flow-dense flex-wrap gap-2">
    {const oneShotClass: ClassValue = `flex-col-center rounded-2xl bg-black/50 p-4 gap-2 max-w-lg`}
    {const oneShotTextClass: ClassValue = `flex-col-center text-wrap text-center`}
    <div class={oneShotClass}>
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
    <div class={oneShotClass}>
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
        }}>Move Submission</Button
      >
    </div>
    <div class={oneShotClass}>
      <div class={oneShotTextClass}>
        <p class="text-2xl/tight">Update Null Values</p>
        <p class="text-gray-300">Update all submissions that have null hash values by fetching the latest data from BeatSaver.</p>
      </div>
      <Button
        onclick={async () => {
          const result = await updateNullValues();
          toast.success(`Updated ${result.updatedCount} submissions with null values.`);
        }}>Update Null Values</Button
      >
    </div>
    <div class={oneShotClass}>
        <div class={oneShotTextClass}>
            <p class="text-2xl/tight">Run Involved Check</p>
            <p class="text-gray-300">Check all submissions for involved mappers and update accordingly. This will not change votes of judges who have already voted.</p>
        </div>
        <Button
          onclick={async () => {
            //const result = await runInvolvedCheck();
            toast.success(`Involved check completed successfully.`);
          }}>Run Involved Check</Button>
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
          judges = await getUsers();
        }}>Save</Button
      >
    </div>
  </div>
</Dialog>
