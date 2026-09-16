<script lang="ts">
  import { onMount } from "svelte";
  import { m } from "$lib/paraglide/messages";
  import { CharacteristicEnum, DifficultyEnum, SubmissionCategory } from "../lib/shared/goodies";
  import { submitMap } from "./submit.remote";
  import loginbl from "$lib/media/loginbl.png";
  import loginbs from "$lib/media/loginbs.png";
  import { enhance } from "$app/forms";
  import { getMap } from "$lib/shared/getMap";
  import DiffIcon from "../lib/components/DiffIcon.svelte";
  import { setLocale } from "../lib/paraglide/runtime.js";

  const { data: _internal } = $props();
  const { user } = $derived(_internal);

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

  let ostMaps = [`OST 9 - Beat Saber 2`];

  function resetForm() {
    submitMap.fields.name.set(``);
    submitMap.fields.bsrId.set(``);
    submitMap.fields.characteristic.set(CharacteristicEnum.Standard);
    submitMap.fields.difficulty.set(DifficultyEnum.ExpertPlus);
  }

  let message = $state(``);
  let showMessage = $state(false);
  let isGoodMessage = $state(false);
  function handleMessage(shouldResetForm = false) {
    if (shouldResetForm) {
      resetForm();
    }
    showMessage = true;
    isGoodMessage = shouldResetForm;
    setTimeout(() => {
      showMessage = false;
    }, 3000); // Hide the success message after 3 seconds
  }

  function getMapCheck(id?: string) {
    if (!id || id.trim() === "" || id.length !== 5) {
      return;
    }
    return getMap(id);
  }

  function timeRemaining() {
    const timeLeft = new Date("16 Dec 2026 00:00:00 UTC").getTime() - new Date().getTime();
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    if (timeLeft < 0) {
      return m[`homepage.form.submissionsAreClosed`]();
    } else {
      return `${m[`homepage.form.timeLeft`]()} ${days} days, ${hours} ${hours == 1 ? "hour" : "hours"}, ${minutes} ${minutes == 1 ? "minute" : "minutes"}.`;
    }
  }

  onMount(() => {
    submitMap.fields.category.set(SubmissionCategory.MapOfTheYear);
    resetForm();
  });
</script>

<div class="my-8 flex flex-col items-center justify-center">
  <div class="max-w-4xl rounded-lg bg-black/70 p-12 py-8 text-center">
    <h1 class="text-4xl font-bold">{m[`homepage.title`]()}</h1>
    <h2 class="text-2xl font-bold">{m[`homepage.subtitle`]()}</h2>
    <p class="mt-4 text-lg/snug [&>a]:text-cyan-300 [&>a]:transition-colors [&>a]:duration-150 [&>a]:hover:text-cyan-500 [&>a]:hover:underline">
      {@html m[`homepage.description`]({
        bSaberUrl: `https://bsaber.com`,
        countId: `#counts`,
      })}
    </p>
    <div class="flex gap-2 justify-center items-center mt-2 -mb-4">
      {#each ([
        {key: `en`, str: `English`},
        {key: `jp`, str: `日本語`}
      ] as const) as lang}
        <button class="px-2 py-1 bg-black/50 transition-colors duration-150 hover:bg-black/70 rounded-md" onclick={() => setLocale(lang.key)}>{lang.str}</button>
      {/each}
    </div>
  </div>
  <div class="m-4 min-w-4xl rounded-lg bg-black/70 p-12 py-4 text-center">
    <h2 class="text-3xl font-bold">{m[`homepage.form.title`]()}</h2>
    <p class="mb-2 text-lg/snug">{timeRemaining()}</p>
    <!-- <p>{m[`homepage.form.description`]()}</p> -->
    {#if user && user.service !== `judgeId`}
      <form
        class="relative mx-auto flex max-w-100 flex-col gap-2 text-left"
        {...submitMap.enhance(async (form) => {
          if (await form.submit()) {
            try {
              if (form.result?.message) {
                message = m[form.result?.message]();
              } else {
                throw new Error(`No message available`);
              }
            } catch (e) {
              message = `Message not available`;
            }
            handleMessage(form.result?.success);
          } else {
            message = m[`homepage.form.response.invalidRequest`]();
            handleMessage(false);
          }
        })}
      >
        <!-- category -->
        <span class="flex flex-col gap-1">
          <label class="text-lg font-bold" for="category">{m[`homepage.form.category`]()}</label>
          <select class="text-lg" placeholder="Select category..." {...submitMap.fields.category.as("select")}>
            {#each Object.values(SubmissionCategory) as category}
              <option value={category}>{m[`common.category.${category}.dropdown`]()}</option>
            {/each}
          </select>
          <p class="pt-2 text-center text-base/snug italic">{curCategory ? m[`common.category.${curCategory}.description`]() : ""}</p>
        </span>

        <span class="flex flex-col gap-1">
          {#if showBsrId}
            <label class="text-lg font-bold" for="bsrId">{m[`homepage.form.bsrKey`]()}</label>
            <input class="text-lg" type="text" {...submitMap.fields.bsrId.as("text", SubmissionCategory.OST)} />
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

        {#await getMapCheck(submitMap.fields.bsrId.value())}
          <span></span>
        {:then map}
          {#if map}
            <div class="flex h-32 flex-row rounded-lg bg-black/40 p-2">
              <img class="rounded-lg" src={map?.versions[0].coverURL} />
              <div class="ml-4 flex flex-col justify-center">
                <p class="text-xl font-bold text-white">{map?.metadata.songName}</p>
                <p class="text-base text-white/50">{map?.metadata.songAuthorName} - {map?.metadata.levelAuthorName}</p>
                <div class="mt-2 flex flex-row flex-wrap gap-2">
                  {#each map.versions[0].diffs as diff}
                    <DiffIcon characteristic={diff.characteristic as CharacteristicEnum} difficulty={diff.difficulty as DifficultyEnum} size="sm" />
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        {:catch error}
          <div class="flex flex-row bg-black/5 p-2">
            <p>{error.message}</p>
          </div>
        {/await}
        <button class="my-2 rounded-lg bg-green-600 px-4 py-1 font-bold text-white hover:bg-green-700">{m[`homepage.form.submit`]()}</button>
        {#if showMessage}
          <div class="absolute m-[-2%] flex h-[102%] w-[104%] items-center justify-center rounded-md bg-black/75">
            <p class="rounded-md px-4 py-2 text-center text-2xl text-white {isGoodMessage ? `bg-green-600` : `bg-red-600`}">{message}</p>
          </div>
        {/if}
      </form>
      <p class="text-center text-sm text-white/50">
        {m[`common.loggedInAs`]({ username: user.username })} •
        <a href="/api/auth/logout">{m[`common.logout`]()}</a>
        {user.isVerifiedMapper ? ` • ${m[`common.verifiedMapper`]()}` : ``}
      </p>
    {:else if false || (user && user.service === `judgeId`)}
      <div class="flex flex-col items-center justify-center gap-2">
        <p class="max-w-lg text-center text-lg/snug text-wrap italic">{m[`homepage.form.loggedInAsJudge`]()}</p>
        <a class="my-2 rounded-lg bg-white/20 px-4 py-1 font-bold text-white hover:bg-white/30" href="/apit/auth/logout">{m[`common.logout`]()}</a>
      </div>
    {:else}
      <p class="text-center text-lg/snug italic">{m[`homepage.form.notLoggedIn`]()}</p>
      <div class="flex flex-row items-center justify-center gap-2">
        <a href="/api/auth/beatleader">
          <img src={loginbl} class="w-75 max-w-75 min-w-25" width="300px" alt="Login with BeatLeader" />
        </a>
        <a href="/api/auth/beatsaver">
          <img src={loginbs} class="w-75 max-w-75 min-w-25" width="300px" alt="Login with BeatSaver" />
        </a>
      </div>
    {/if}
  </div>
</div>
