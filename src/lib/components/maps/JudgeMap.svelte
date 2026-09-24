<script lang="ts">
  import type { InferAttributes } from "sequelize";
  import type { SortedSubmission, JudgeVote } from "../../server/database";
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
  import { vote } from "../../../routes/api/judging.remote";
  import pDebounce from "p-debounce";
  import heartRemoveOutline from "$lib/media/icons/heart-x.svg"


  let props: {
    sortedSubmission: InferAttributes<SortedSubmission>;
    vote?: InferAttributes<JudgeVote>;
    bsAPI?: BSMap;
    onVote: (vote: InferAttributes<JudgeVote>) => void;
    enableButtons: boolean;
  } & HTMLAttributes<HTMLDivElement> = $props();

  let divProps = $derived.by(() => {
    const { sortedSubmission, bsAPI, vote, ...rest } = props;
    return rest;
  });

  let subText = $derived.by(() => {
    let text = `${props.bsAPI?.id}`;
    if (props.sortedSubmission.category.startsWith(`Ranked`)) {
      let selectedDiff = props.bsAPI?.versions[0].diffs.find((diff) => diff.characteristic === props.sortedSubmission.characteristic && diff.difficulty === props.sortedSubmission.difficulty);
      text = `${text} | BL: ${selectedDiff?.blStars ?? "N/A"}★ | SS: ${selectedDiff?.stars ?? "N/A"}★`;
    } else if (props.sortedSubmission.category.startsWith(`Mods`)) {
      let selectedDiff = props.bsAPI?.versions[0].diffs.find((diff) => diff.characteristic === props.sortedSubmission.characteristic && diff.difficulty === props.sortedSubmission.difficulty);
      text = `${text} | NE: ${selectedDiff?.ne ?? "No"} | Chroma: ${selectedDiff?.chroma ?? "no"}`;
    } else {
      text = `${text} | ${new Date(props.bsAPI?.uploaded ?? 0).toLocaleDateString()}`;
    }
    return text;
  });

  // svelte-ignore state_referenced_locally
  let note = $state(props.vote?.note);
  // svelte-ignore state_referenced_locally
  let voteValue: `1` | `0` | `-1` | `0.5` = $state(props.vote?.score as `1` | `0` | `-1` | `0.5` ?? `0`);
  const handleVotePromise = pDebounce.promise(async () => {
    let ret = vote({
      submissionId: props.sortedSubmission.id,
      score: voteValue,
      note: note ?? undefined
    });
    toast.promise(ret, {
      loading: "Saving vote...",
      success: "Vote saved.",
      error: "Failed to save vote."
    });
    props.onVote(await ret);
  }, {after: true});
  const handleVote = pDebounce(handleVotePromise, 1000, { before: true });
  const handleVoteText = pDebounce(handleVotePromise, 1000);
</script>

<MapBase category={props.sortedSubmission.category} map={props.bsAPI} characteristic={props.sortedSubmission.characteristic} difficulty={props.sortedSubmission.difficulty} {subText} {...divProps}>
  {#snippet children()}
    <div class="flex-col-center min-w-24 gap-2">
        <Button class="w-full hover:bg-green-500/40 {props.vote?.score === `1` ? `ring-1 ring-green-500 bg-green-500/20` : ``}" onclick={() => { voteValue = `1`; handleVote(); }} disabled={!props.enableButtons}>Yes</Button>
        <Button class="w-full hover:bg-yellow-500/40 {props.vote?.score === `0.5` ? `ring-1 ring-yellow-500 bg-yellow-500/20` : ``}" onclick={() => { voteValue = `0.5`; handleVote(); }} disabled={!props.enableButtons}>Involved</Button>
        <Button class="w-full rounded-bl-xl hover:bg-red-500/40 {props.vote?.score === `0` ? `ring-1 ring-red-500 bg-red-500/20` : ``}" onclick={() => { voteValue = `0`; handleVote(); }} disabled={!props.enableButtons}>No</Button>
    </div>
    <textarea bind:value={note} oninput={handleVoteText} placeholder="Add a comment..." rows="4" class="w-full p-2 bg-black/50 rounded-lg"></textarea>
  {/snippet}
  {#snippet extraButtons()}
     <button
      class="flex h-full items-center justify-center bg-black/20 p-1 text-2xl hover:bg-white/10"
      onclick={() => {
        voteValue = `-1`;
        handleVote();
      }}
    >
    <img src={heartRemoveOutline} alt="Remove Vote" />
    </button>
  {/snippet}
</MapBase>
