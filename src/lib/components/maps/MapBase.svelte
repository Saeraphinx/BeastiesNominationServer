<script lang="ts">
  import type { BSMap } from "$lib/shared/beatsaverTypes";
  import type { Snippet } from "svelte";
  import type { Characteristic, Difficulty } from "../../shared/goodies";
  import MapperNameplate from "./MapperNameplate.svelte";
  import DiffIcon from "./DiffIcon.svelte";
  import cloud from "$lib/media/icons/cloud-download.svg";
  import info from "$lib/media/icons/info.svg";
  import download from "$lib/media/icons/download.svg";
  import squarePlay from "$lib/media/icons/square-play.svg";
  import { fade, fly } from "svelte/transition";
  import type { HTMLAttributes } from "svelte/elements";
  import Dialog from "../common/Dialog.svelte";

  let props: {
    map?: BSMap;
    subText?: string;
    characteristic?: Characteristic | null;
    difficulty?: Difficulty | null;
    category?: string;
    children?: Snippet;
    extraButtons?: Snippet;
  } & HTMLAttributes<HTMLDivElement> = $props();

  let divProps = $derived.by(() => {
    const { map, subText, characteristic, difficulty, category, children, extraButtons, ...rest } = props;
    return rest;
  });

  let mappers = $derived.by(() => {
    let mappersArr = [...(props.map?.uploader ? [props.map?.uploader] : []), ...(props.map?.collaborators ?? [])];
    let overflow = 0;
    if (mappersArr.length > 5) {
      overflow = mappersArr.length - 5;
      mappersArr = mappersArr.slice(0, 5);
    }
    mappersArr.sort((a, b) => a.name.length - b.name.length);
    return { arr: mappersArr, overflow: overflow > 0, overflowCount: overflow };
  });

  let viewInfo = $state(false);
  let viewPreview = $state(false);
  let viewerIframeSrc = $state("");
  let difficultyNumber = $derived.by(() => {
    switch (props.difficulty) {
      case "Easy":
        return 1;
      case "Normal":
        return 3;
      case "Hard":
        return 5;
      case "Expert":
        return 7;
      case "ExpertPlus":
        return 9;
      default:
        return 0;
    }
  });
</script>

<div class="relative flex w-lg flex-col overflow-hidden rounded-2xl bg-black/50" {...divProps}>
  <div class="relative flex">
    <div class="relative m-2 h-32 w-32">
      <img class="h-32 w-32 min-w-32 rounded-2xl" src={props.map?.versions[0].coverURL} alt={`Cover of ${props.map?.name}`} />
      {#if props.difficulty && props.characteristic}
        <DiffIcon difficulty={props.difficulty} characteristic={props.characteristic} size="lg" class="absolute right-2 bottom-2" />
      {/if}
    </div>
    <div class="my-4 ml-2 flex w-80 flex-col items-start justify-center gap-2">
      <div class="w-full overflow-hidden overflow-x-hidden text-wrap">
        <p class="text-xs/tight text-gray-300">{props.subText ?? props.map?.id} | {props.map?.metadata.songAuthorName}</p>
        <p class="text-lg/tight font-bold">
          {props.map?.metadata.songName}
          <span class="pl-0.5 text-xs text-gray-300">{props.map?.metadata.songSubName}</span>
        </p>
      </div>
      <div class="flex flex-row flex-wrap items-center justify-start gap-2">
        {#each mappers.arr as mapper}
          <MapperNameplate {mapper} />
        {/each}
        {#if mappers.overflow}
          <p>+{mappers.overflowCount} more</p>
        {/if}
      </div>
    </div>
  </div>
  {#if props.children}
    <div class="flex flex-row items-center justify-center mr-8 gap-2 p-2 pt-0">
      {@render props.children()}
    </div>
  {/if}
  <div class="absolute right-0 my-auto flex h-full flex-col items-center justify-center rounded-r-2xl">
    <button class="flex h-full items-center justify-center bg-black/20 p-1 pt-2 text-2xl hover:bg-white/10" onclick={() => (viewInfo = true)}>
      <img src={info} alt="Info" />
    </button>
    <button
      class="flex h-full items-center justify-center bg-black/20 p-1 text-2xl hover:bg-white/10"
      onclick={() => {
        viewerIframeSrc = `https://cv2.sae.sh/?map=${props.map?.id}&characteristic=${props.characteristic}&difficulty=${difficultyNumber}`;
        //viewerIframeSrc = `https://allpoland.github.io/ArcViewer/?id=${props.map?.id}&characteristic=${props.characteristic}&difficulty=${props.difficulty}`;
        viewPreview = true;
      }}
    >
      <img src={squarePlay} alt="Play" />
    </button>
    {#if props.extraButtons}
      {@render props.extraButtons()}
    {/if}
    <a href="beatsaver://{props.map?.id}" class="flex h-full items-center justify-center bg-black/20 p-1 text-2xl hover:bg-white/10">
      <img src={cloud} alt="Cloud" />
    </a>
    <a href={props.map?.versions[0].downloadURL} class="flex h-full items-center justify-center bg-black/20 p-1 pb-2 text-2xl hover:bg-white/10">
      <img src={download} alt="Download" />
    </a>
  </div>
</div>

<Dialog bind:showDialog={viewInfo}>
  <div onclick={(e) => e.stopPropagation()} role="presentation" class="z-20 max-h-[80%] max-w-[80%] overflow-x-hidden overflow-y-scroll rounded-lg bg-black/90 p-8 py-4 text-center text-wrap">
      <p class="text-2xl text-white">{props.map?.name}</p>
      <p class="text-lg text-white">{props.map?.metadata.songAuthorName} - {props.map?.metadata.songName}{props.map?.metadata.songSubName ? ` ${props.map?.metadata.songSubName}` : ""}</p>
      <p class="text-white">In-Game Mapper(s): {props.map?.metadata.levelAuthorName} | Mapper(s): {mappers.arr.map((mapper) => mapper.name).join(", ")}</p>
      <p class="text-white">Uploader: {props.map?.uploader.name}</p>
      <p class="my-8 text-left whitespace-pre-wrap text-white">{props.map?.description}</p>
      <pre class="text-left text-white">{JSON.stringify(props.map, null, 2)}</pre>
  </div>
</Dialog>

<Dialog bind:showDialog={viewPreview} class="m-auto flex h-full w-full items-center justify-center bg-black/30" contentClass="">
    <iframe onclick={(e) => e.stopPropagation()} role="presentation" src={viewerIframeSrc} class="z-20 h-[80%] w-[90%]" title="Map Preview" frameborder="0"></iframe>
</Dialog>

<!-- <div class="flex w-64 flex-col items-center justify-center gap-2 rounded-lg bg-black/30 p-2">
  {#if props.category}
    <div class="flex flex-row items-center justify-center">
        {#if props.characteristic && props.difficulty}
            <DiffIcon characteristic={props.characteristic} difficulty={props.difficulty} size="lg" />
        {/if}
        <p class="text-lg/tight px-2">{props.category}</p>
    </div>
  {/if}
  {#if props.map}
    <div class="overflow-hidden flex flex-col items-center justify-center">
        <a class="max-w-60 overflow-hidden text-ellipsis whitespace-nowrap hover:text-blue-300 font-bold text-lg/tight" href={`https://beatsaver.com/maps/${props.map.id}`} title={`${props.map.metadata.songName} by ${props.map.metadata.songAuthorName}`} target="_blank" rel="noopener noreferrer">{`${props.map.metadata.songName} by ${props.map.metadata.songAuthorName}`}</a>
        <p class="text-sm/tight p-0">{props.subText ?? props.map.id}</p>
    </div>
    <img class="h-32 w-32 rounded-2xl" src={props.map.versions[0].coverURL} alt={`Cover of ${props.map.name}`} />
    <div class="flex flex-row flex-wrap items-center justify-center gap-2">
      {#each mappers.arr as mapper}
        <MapperNameplate {mapper} />
      {/each}
      {#if mappers.overflow}
        <p>+{mappers.overflowCount} more</p>
      {/if}
    </div>
  {:else}
    <p>No map available</p>
  {/if}
  <div>
    {#if props.children}
      {@render props.children()}
    {/if}
  </div>
  <div class="flex flex-row flex-wrap items-center justify-center gap-2">
    <Button class="w-10 text-2xl">🛈</Button>
    <Button href={`https://chroviewer.com/?map=${props.map?.id}`} class="w-10 text-2xl">▶</Button>
    <Button class="w-10 text-2xl">☁</Button>
    <Button class="w-10 text-2xl">⬇</Button>
  </div>
</div> -->
