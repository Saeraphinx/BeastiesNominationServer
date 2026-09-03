<script>
  import { onMount } from "svelte";
  import { m } from "$lib/paraglide/messages";
  import { CharacteristicEnum, DifficultyEnum, SubmissionCategory } from "../lib/shared/goodies";
  import { submitMap } from "./submit.remote";

  let curCategory = $derived(submitMap.fields.category.value());
  let showOst = $derived(curCategory === SubmissionCategory.OST);
  let showDiffChar = $derived(
    curCategory !== SubmissionCategory.OST &&
    curCategory !== SubmissionCategory.FullSpreadMap &&
    curCategory !== SubmissionCategory.PackOfTheYear &&
    curCategory !== SubmissionCategory.MapperOfTheYear &&
    curCategory !== SubmissionCategory.LighterOfTheYear &&
    curCategory !== SubmissionCategory.RookieMapperOfTheYear &&
    curCategory !== SubmissionCategory.RookieLighterOfTheYear
  );
  let showBsrId = $derived(
    curCategory !== SubmissionCategory.OST &&
    curCategory !== SubmissionCategory.PackOfTheYear &&
    curCategory !== SubmissionCategory.MapperOfTheYear &&
    curCategory !== SubmissionCategory.LighterOfTheYear &&
    curCategory !== SubmissionCategory.RookieMapperOfTheYear &&
    curCategory !== SubmissionCategory.RookieLighterOfTheYear
  );

  let ostMaps = [
    `OST 9 - Beat Saber 2`
  ]

  onMount(() => {
    submitMap.fields.category.set(SubmissionCategory.MapOfTheYear);
    submitMap.fields.name.set(``);
    submitMap.fields.bsrId.set(``);
  });
</script>

<div class="flex flex-col items-center justify-center my-8">
  <div class="max-w-4xl p-12 py-8 bg-black/70 rounded-lg text-center">
    <h1 class="text-4xl font-bold">{m[`homepage.title`]()}</h1>
    <h2 class="text-2xl font-bold">{m[`homepage.subtitle`]()}</h2>
    <p class="mt-4 text-lg/snug [&>a]:text-cyan-300 [&>a]:hover:text-cyan-500 [&>a]:hover:underline [&>a]:transition-colors [&>a]:duration-150">{@html m[`homepage.description`]({
      bSaberUrl: `https://bsaber.com`,
      countId: `#counts`
    })}</p>
  </div>
  <div class="m-4 min-w-4xl p-12 py-4 gap-4 bg-black/70 rounded-lg text-center">
    <h2 class="text-3xl font-bold">{m[`homepage.form.title`]()}</h2>
    <p class="text-lg/snug">Time left to submit: <span id="timeLeft"></span></p>
    <!-- <p>{m[`homepage.form.description`]()}</p> -->
    <form class="mx-auto max-w-100 flex flex-col gap-2 text-left" {...submitMap}>
      <!-- category -->
      <span class="flex flex-col gap-1">
        <label class="text-lg font-bold" for="category">{m[`homepage.form.category`]()}</label>
        <select class="text-lg" placeholder="Select category..." {...submitMap.fields.category.as("select")}>
          {#each Object.values(SubmissionCategory) as category}
            <option value={category}>{m[`common.category.${category}.dropdown`]()}</option>
          {/each}
        </select>
        <p class="italic text-center text-base/snug pt-2">{curCategory ? m[`common.category.${curCategory}.description`]() : ''}</p>
      </span>
      
      <span class="flex flex-col gap-1">
      {#if showBsrId}
        <label class="text-lg font-bold" for="bsrId">{m[`homepage.form.bsrKey`]()}</label>
        <input class="text-lg"  type="text" {...submitMap.fields.bsrId.as("text", SubmissionCategory.OST)} />
      {:else if showOst}
        <label class="text-lg font-bold" for="ost">{m[`homepage.form.ostName`]()}</label>
        <select class="text-lg" {...submitMap.fields.name.as("select")}>
            {#each ostMaps as ost}
              <option value={ost}>{ost}</option>
            {/each}
        </select>
      {:else}
        <label class="text-lg font-bold" for="name">{m[`homepage.form.name`]()}</label>
        <input class="text-lg" type="text" {...submitMap.fields.name.as("text")} />
      {/if}
      </span>

      {#if showDiffChar}
        <span class="flex flex-col gap-1">
          <label class="text-lg font-bold" for="difficulty">{m[`homepage.form.difficulty`]()}</label>
          <select class="text-lg" {...submitMap.fields.difficulty.as("select")}>
            {#each Object.values(DifficultyEnum) as difficulty}
              {#if difficulty !== `All`}
                <option value={difficulty}>{m[`common.difficulty.${difficulty}`]()}</option>
              {/if}
            {/each}
          </select>
        </span>

        <span class="flex flex-col gap-1">
          <label class="text-lg font-bold" for="characteristic">{m[`homepage.form.characteristic`]()}</label>
          <select class="text-lg" {...submitMap.fields.characteristic.as("select")}>
            {#each Object.values(CharacteristicEnum) as characteristic}
              {#if characteristic !== `All` && characteristic !== `Other`}
                <option value={characteristic}>{m[`common.characteristic.${characteristic}`]()}</option>
              {/if}
            {/each}
          </select>
        </span>
      {/if}
      <button class="bg-green-600 hover:bg-green-700 text-white font-bold my-2 py-1 px-4 rounded-lg">{m[`homepage.form.submit`]()}</button>
    </form>
  </div>
</div>