<script>
  import { m } from "../lib/paraglide/messages";
  import { CharacteristicEnum, DifficultyEnum, SubmissionCategory } from "../lib/shared/goodies";
  import { submitMap } from "./submit.remote";

  let category = $derived(submitMap.fields.category.value());
  let showOst = $derived(category === SubmissionCategory.OST);
  let showDiffChar = $derived(
    category !== SubmissionCategory.OST &&
    category !== SubmissionCategory.FullSpreadMap &&
    category !== SubmissionCategory.PackOfTheYear &&
    category !== SubmissionCategory.MapperOfTheYear &&
    category !== SubmissionCategory.LighterOfTheYear &&
    category !== SubmissionCategory.RookieMapperOfTheYear &&
    category !== SubmissionCategory.RookieLighterOfTheYear
  );
  let showBsrId = $derived(
    category === SubmissionCategory.OST ||
    category === SubmissionCategory.FullSpreadMap ||
    category === SubmissionCategory.PackOfTheYear ||
    category === SubmissionCategory.MapperOfTheYear ||
    category === SubmissionCategory.LighterOfTheYear ||
    category === SubmissionCategory.RookieMapperOfTheYear ||
    category === SubmissionCategory.RookieLighterOfTheYear
  );

  let ostMaps = [
    `OST 9 - Beat Saber 2`
  ]
</script>

<div id="info">
  <h1>{m[`homepage.title`]()}</h1>
  <h2>{@html m[`homepage.subtitle`]()}</h2>
  <p class="bio">{m[`homepage.description`]({
    bSaberUrl: `https://bsaber.com`,
    countId: `#counts`
  })}</p>
</div>
<div>
  <form {...submitMap}>
    <label for="category">{m[`homepage.form.category`]()}</label>
    <select {...submitMap.fields.category.as("select")}>
      {#each Object.values(SubmissionCategory) as category}
        <option value={category}>{m[`common.category.${category}.dropdown`]()}</option>
      {/each}
    </select>
    {#if showOst}
      <label for="ost">{m[`homepage.form.ostName`]()}</label>
      <select {...submitMap.fields.name.as("select")}>
        {#each ostMaps as ost}
          <option value={ost}>{ost}</option>
        {/each}
      </select>
    {/if}

    {#if showDiffChar}
      <label for="difficulty">{m[`homepage.form.difficulty`]()}</label>
      <select {...submitMap.fields.difficulty.as("select")}>
        {#each Object.values(DifficultyEnum) as difficulty}
          <option value={difficulty}>{m[`common.difficulty.${difficulty}`]()}</option>
        {/each}
      </select>

      <label for="characteristic">{m[`homepage.form.characteristic`]()}</label>
      <select {...submitMap.fields.characteristic.as("select")}>
        {#each Object.values(CharacteristicEnum) as characteristic}
          <option value={characteristic}>{m[`common.characteristic.${characteristic}`]()}</option>
        {/each}
      </select>
    {/if}

    {#if showBsrId}
      <label for="bsrId">{m[`homepage.form.bsrKey`]()}</label>
      <input type="text" {...submitMap.fields.bsrId.as("text")} />
    {/if}
  </form>
</div>