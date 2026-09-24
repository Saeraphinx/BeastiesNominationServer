<script lang="ts">
  import Button from "../../../lib/components/common/Button.svelte";
  import { SortedSubmissionsCategory } from "../../../lib/shared/goodies.js";
  import { getJudgeStats } from "../../api/judging.remote.js";

  const { data: _internal } = $props();
  const { judge } = $derived(_internal);

  let categories = $derived.by(() => {
    if (judge.roles.includes("admin")) {
      return Object.values(SortedSubmissionsCategory);
    } else if (!judge.roles.includes(`judge`)) {
      return [];
    } else {
      return judge.permittedCategories ?? [];
    }
  });

  const categoriesList = $derived.by(() => {
    let ret: Record<string, string[]> = {};
    for (const category of categories) {
      let catCat = category.split(`-`)[0];
      if (!ret[catCat]) {
        ret[catCat] = [];
      }
      ret[catCat].push(category);
    }
    return ret;
  });

  let voteSummary = await getJudgeStats();
</script>

<div class="[&>div]:mb-4">
  <div class="flex-col-center gap-2 mt-4 bg-black/50 p-4 rounded-2xl">
    <p class="text-xl font-bold">Vote Summary</p>
    {#each Object.entries(voteSummary) as [category, summary]}
      {let percentage = summary.votes / (summary.submissionCount || 1) * 100}
      <div class="grid grid-cols-[1fr_2fr] gap-4">
        <p>{category}</p>
        <span class="bg-gray-500 w-64 rounded-2xl">
          <span class="bg-green-500 rounded-2xl text-center" style="width: {percentage}%; display: inline-block;"><p class="px-4">{percentage.toFixed(1)}%</p></span>
        </span>
      </div>
    {/each}
  </div>
  <div class="flex-row-center max-w-xl flex-wrap gap-2 bg-black/50 p-4 rounded-2xl">
    <p class="text-xl font-bold w-full text-center">Select Category</p>
    {#each Object.keys(categoriesList) as categoryCategory}
      <span class="w-full mx-8 bg-gray-500/10 h-1"></span>
      <p class="w-full text-center text-2xl">{categoryCategory}</p>
      {#each categoriesList[categoryCategory] as subcategory}
        <Button href="/judging/judge/{subcategory}">{subcategory}</Button>
      {/each}
    {/each}
  </div>
  
</div>
