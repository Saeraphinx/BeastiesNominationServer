<script lang="ts">
    import type { Pathname } from "$app/types";
    import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import { locales, localizeHref } from "$lib/paraglide/runtime";
    import "../app.css";
    import favicon from "$lib/media/favicon.png";
    import { m } from "../lib/paraglide/messages";

    let { children } = $props();
</script>

<svelte:head>
    <link href='https://fonts.googleapis.com/css?family=Lato' rel='stylesheet'>
    <link rel="icon" href={favicon} />
      {#if page.data.pageMetadata?.title && page.data.pageMetadata?.title.includes(" - ")}
        <title>{page.data.pageMetadata.title}</title>
    {:else if page.data.pageMetadata?.title}
        <title>{page.data.pageMetadata?.title ? `${page.data.pageMetadata.title} - ${m[`title`]()}` : `${m[`title`]()}`}</title>
    {:else}
        <title>{m[`title`]()}</title>
    {/if}
    <link rel="icon" href="/favicon.png" />
    <!-- OpenGraph -->
    {#if page.data.pageMetadata?.title && page.data.pageMetadata?.title.includes(" - ")}
        <meta property="og:title" content={page.data.pageMetadata.title} />
    {:else if page.data.pageMetadata?.title}
        <meta property="og:title" content={`${page.data.pageMetadata.title} - ${m[`title`]()}`} />
    {:else}
        <meta property="og:title" content={`${m[`title`]()}`} />
    {/if}
    <meta property="og:description" content={page.data.pageMetadata?.description! ?? m[`homepage.descriptionNoLinks`]()} />
    <meta property="og:image" content={page.data.pageMetadata?.imageUrl ?? favicon} />
    <meta name="theme-color" content="#972DE2" />

</svelte:head>

<div class="basebody">
    {@render children()}
</div>

<div style="display:none">
    {#each locales as locale (locale)}
        <a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
    {/each}
</div>

<style>
    .basebody {
        background-image: linear-gradient(120deg, #b52a1c -49%, #454088 27.08%, #454088 70%, #1268a1);
        background: linear-gradient(127deg, #f708d4, #4808f7, #a24aff, #8f18f7, #f708e9);
        background-size: 1000% 1000%;
        animation: bg 90s ease infinite;
        font-family: "Lato", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
</style>