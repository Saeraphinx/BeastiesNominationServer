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
  import { Toaster } from "svelte-sonner";

  let { children, data: _internal } = $props();
  const { user, judge, fetch } = $derived(_internal);

  let links = [
    { enabled: true, href: "/", text: m[`judging.navigation.submissionForm`]() },
    { enabled: true, href: "/judging", text: m[`judging.navigation.home`]() },
    // svelte-ignore state_referenced_locally
    { enabled: judge.roles.includes(`sort`) || judge.roles.includes(`admin`), href: "/judging/sort", text: m[`judging.navigation.sort`]() },
    // svelte-ignore state_referenced_locally
    { enabled: judge.roles.includes(`judge`) || judge.roles.includes(`admin`), href: "/judging/judge", text: m[`judging.navigation.judge`]() },
    { enabled: false, href: "/finalists", text: m[`judging.navigation.finalists`]() },
    { enabled: false, href: "/render", text: m[`judging.navigation.renderer`]() },
    // svelte-ignore state_referenced_locally
    { enabled: judge.roles.includes(`admin`), href: "/judging/admin", text: m[`judging.navigation.admin`]() },
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

  let roleClass = $derived.by(() => {
    if (judge.roles.includes(`admin`)) {
      return `admin-glow-ani`;
    } else if (judge.roles.includes(`sort`)) {
      return `sort-glow-ani`;
    } else if (judge.roles.includes(`judge`)) {
      return `judge-glow-ani`;
    } else {
      return ``;
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
    <ul class="flex flex-row items-center justify-center gap-2 m-2 p-1 px-2 rounded-md bg-black/70 text-white">
      {#each links as link}
        {let isActive = $derived.by(() => page.url.pathname.endsWith(link.href))}
        {let isEnabled = link.enabled}
        <li class="hover:bg-white/20 p-2 rounded-md transition-colors duration-150">
          {#if isEnabled}
            <a class={`${isActive ? "text-yellow-500" : "text-white"}`} href={link.href}>{link.text}</a>
          {:else}
            <span class="text-white/50">{link.text}</span>
          {/if}
        </li>
      {/each}
      <div class="w-0.5 h-8 bg-white/50 not-sm:hidden"></div>
      <li class="not-sm:hidden">
        <select class="bg-black/70 text-white" bind:value={currentBackgroundName} >
          <option value="Default">Random Background</option>
          {#each backgrounds as background}
            <option value={background.name}>{background.name}</option>
          {/each}
        </select>
      </li>
      <div class="w-0.5 h-8 bg-white/50 not-sm:hidden"></div>
      <div class="flex flex-row items-center gap-2">
        <img src={user.avatarUrl} alt="User Avatar" class="w-8 h-8 rounded-full" />
        <p class={roleClass}>{user.username}</p>
        <a class="hover:bg-white/20 p-2 rounded-md transition-colors duration-150" href="/api/auth/logout">Logout</a>
      </div>
    </ul>
  </nav>
  <div class="mb-16">
    {@render children()}
  </div>
  <footer class="fixed bottom-0 left-0 w-full py-2 mb-6 text-center text-white/50 text-shadow-md">
    <p class="text-sm">Background Credit: {backgrounds.find(bg => bg.url === currentBackgroundUrl)?.credit}</p>
  </footer>
</div>

<Toaster theme="dark"/>

<style>
  .basebody {
    font-family: "Lato", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

.admin-glow-ani {
  color: #FFF;
  font-weight: bold;
  animation: pink-aura-pulse 10s infinite alternate ease-in-out;
}

.judge-glow-ani {
  color: #FFF;
  font-weight: bold;
  animation: blue-aura-pulse 10s infinite alternate ease-in-out;
}

.sort-glow-ani {
  color: #FFF;
  font-weight: bold;
  animation: green-aura-pulse 10s infinite alternate ease-in-out;
}

@keyframes pink-aura-pulse {
  0% {
    text-shadow: 
      3px 0 8px #5900ff, 
      0 3px 10px #ff0000, 
      0 0 7px #660066,
      0 0 20px #ff006f, 
      0 0 20px #ff33cc, 
      0 0 20px #660066;
  }
  50% {
    text-shadow: 
      0 3px 4px #ff006f, 
      -3px 0 8px #ff33cc, 
      -3px 0 9px #660066,
      0 0 20px #ff006f, 
      0 0 20px #ff33cc, 
      0 0 20px #660066;
  }
  100% {
    text-shadow: 
      -3px 0 6px #ff00ea, 
      0 3px 12px #ff0095, 
      3px 0 12px #660066,
      0 0 20px #bb165d, 
      0 0 20px #9d0aff, 
      0 0 20px #a30ba3;
  }
}

@keyframes blue-aura-pulse {
  0% {
    text-shadow: 
      3px 0 8px #0000ff, 
      0 3px 10px #00ffff, 
      0 0 7px #006666,
      0 0 20px #4f7cfa, 
      0 0 20px #004cff, 
      0 0 20px #000766;
  }
  50% {
    text-shadow: 
      0 3px 4px #0040ff, 
      -3px 0 8px #0077ff, 
      -3px 0 9px #006666,
      0 0 20px #09489c, 
      0 0 20px #005eff, 
      0 0 20px #006666;
  }
  100% {
    text-shadow: 
      -3px 0 6px #00ffff, 
      0 3px 12px #00ffff, 
      3px 0 12px #006666,
      0 0 20px #00ffff, 
      0 0 20px #00ffff, 
      0 0 20px #006666;
  }
}

@keyframes green-aura-pulse {
  0% {
    text-shadow: 
      3px 0 8px #00ff00, 
      0 3px 10px #00ffcc, 
      0 0 7px #006600,
      0 0 20px #00ff66, 
      0 0 20px #00ff33, 
      0 0 20px #006600;
  }
  50% {
    text-shadow: 
      0 3px 4px #00ff66, 
      -3px 0 8px #00ff33, 
      -3px 0 9px #006600,
      0 0 20px #00ff66, 
      0 0 20px #00ff33, 
      0 0 20px #006600;
  }
  100% {
    text-shadow: 
      -3px 0 6px #00ff99, 
      0 3px 12px #00ff66, 
      3px 0 12px #006600,
      0 0 20px #00ff66, 
      0 0 20px #00ff33, 
      0 0 20px #006600;
  }
}
</style>