<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import { onMount } from "svelte";
  import type { Judge } from "../../../lib/server/database";
  import { editUserRole, getUsers, setUserCategories } from "./admin.remote";
  import Button from "../../../lib/components/common/Button.svelte";
  import { toast } from "svelte-sonner";
  import { flip } from "svelte/animate";
  import Dialog from "../../../lib/components/common/Dialog.svelte";
  import { SortedSubmissionsCategory } from "../../../lib/shared/goodies";

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
    <table class="prose prose-invert">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Roles</th>
          <th>Categories</th>
          <th>Actions</th>
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
              <td>{judge.permittedCategories.join(", ")}</td>
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
</div>

<!-- svelte-ignore state_referenced_locally -->
<Dialog bind:showDialog={showCategoriesDialog}>
  <div class="max-w-xl w-full bg-black/90" role="presentation" onclick={(e) => e.stopPropagation()}>
    {let selectedJudge = $derived(judges.find((j) => j.id === selectedJudgeId))}
    {let selectedCategories = $state(selectedJudge?.permittedCategories ?? [])}
    <p class="text-2xl m-2">Edit categories for {selectedJudge?.name}</p>
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
    <div class="flex-row-center {selectedJudge ? `visible` : `invisible`} mt-2 gap-4">
        <Button class="bg-white/10" onclick={() => (showCategoriesDialog = false)}>Close</Button>
        <Button class="bg-white/10" onclick={async () => {
            await setUserCategories({ judgeId: selectedJudge?.id ?? -1, categories: selectedCategories });
            showCategoriesDialog = false;
            toast.success("Categories updated successfully.");
            judges = await getUsers();
        }}>Save</Button>
    </div>
  </div>
</Dialog>
