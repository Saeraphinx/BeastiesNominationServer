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

<div>
    {@render children()}
</div>

<div style="display:none">
    {#each locales as locale (locale)}
        <a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
    {/each}
</div>
