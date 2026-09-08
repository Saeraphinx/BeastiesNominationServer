<script lang="ts">
  import { page } from "$app/state";
  import { m } from "$lib/paraglide/messages";
  import aether0 from "$lib/media/backgrounds/aether0.png";
  import aether1 from "$lib/media/backgrounds/aether1.png";
  import aether2 from "$lib/media/backgrounds/aether2.png";
  import aether3 from "$lib/media/backgrounds/aether3.png";
  import you0 from "$lib/media/backgrounds/you0.png";
  import you1 from "$lib/media/backgrounds/you1.png";
  import you2 from "$lib/media/backgrounds/you2.png";
  import { onMount } from "svelte";

  let { children } = $props();
  let links = [
    { enabled: true, href: "/", text: m[`judging.navigation.submissionForm`]() },
    { enabled: true, href: "/judging", text: m[`judging.navigation.home`]() },
    { enabled: false, href: "/judging/sort", text: m[`judging.navigation.sort`]() },
    { enabled: false, href: "/judging/judge", text: m[`judging.navigation.judge`]() },
    { enabled: false, href: "/finalists", text: m[`judging.navigation.finalists`]() },
    { enabled: false, href: "/render", text: m[`judging.navigation.renderer`]() },
    { enabled: true, href: "/judging/admin", text: m[`judging.navigation.admin`]() },
  ];

  let backgrounds = [
    //{ name: `Aether`, url: aether0, credit: `743⁺Aether*✧ ˳ ⁎ ¹¹¹} ⁺ . ˳ by Swifter` },
    { name: `Aether 2`, url: aether1, credit: `743⁺Aether*✧ ˳ ⁎ ¹¹¹} ⁺ . ˳ by Swifter` },
    { name: `Aether 3`, url: aether2, credit: `743⁺Aether*✧ ˳ ⁎ ¹¹¹} ⁺ . ˳ by Swifter` },
    { name: `Aether 4`, url: aether3, credit: `743⁺Aether*✧ ˳ ⁎ ¹¹¹} ⁺ . ˳ by Swifter` },
    { name: `You`, url: you0, credit: `you by Swifter` },
    { name: `You 2`, url: you1, credit: `you by Swifter` },
    { name: `You 3`, url: you2, credit: `you by Swifter` },
  ];

  let currentBackgroundName = $state(`None`);
  let currentBackgroundUrl = $derived.by(() => {
    if (currentBackgroundName == `Default`) {
      let randomIndex = Math.floor(Math.random() * backgrounds.length);
      return backgrounds[randomIndex].url;
    } else {
      let background = backgrounds.find((bg) => bg.name === currentBackgroundName);
      if (background) {
        return background.url;
      } else {
        return ``;
      }
    }
  });
  
  onMount(() => {
    currentBackgroundName = localStorage.getItem(`judgingBackground`) ?? `You`;
  });

  $effect(() => {
    if (currentBackgroundUrl === ``) {
        currentBackgroundName = `Default`;
    }
    localStorage.setItem(`judgingBackground`, currentBackgroundName);
  });
</script>

<div class="fixed w-full h-full bg-black -z-50"></div>
<div class="fixed w-full h-full bg-cover -z-49 bg-no-repeat bg-center blur-md " style="background-image: url({currentBackgroundUrl});"></div>

<div class="basebody">
  <nav>
    <ul class="flex flex-row items-center justify-center gap-2 m-2 p-1 bg-black/70 text-white">
      {#each links as link}
        {let isActive = page.url.pathname === link.href}
        {let isEnabled = link.enabled}
        <li class="hover:bg-white/20 p-2 rounded-md transition-colors duration-150">
          {#if isEnabled}
            <a class={`${isActive ? "text-yellow-500" : "text-white"}`} href={link.href}>{link.text}</a>
          {:else}
            <span class="text-white/50">{link.text}</span>
          {/if}
        </li>
      {/each}
      <div class="w-0.5 h-8 bg-white/50"></div>
      <li>
        <select class="bg-black/70 text-white" bind:value={currentBackgroundName} >
          <option value="Default">Random Background</option>
          {#each backgrounds as background}
            <option value={background.name}>{background.name}</option>
          {/each}
        </select>
      </li>
    </ul>
  </nav>
  <div>
    {@render children()}
  </div>
  <footer class="fixed bottom-0 left-0 w-full py-2 mb-6 text-center text-white/50 text-shadow-md">
    <p class="text-sm">Background Credit: {backgrounds.find(bg => bg.url === currentBackgroundUrl)?.credit}</p>
  </footer>
</div>

<style>
  .basebody {
    font-family: "Lato", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>