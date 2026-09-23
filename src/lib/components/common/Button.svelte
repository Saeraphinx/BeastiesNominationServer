<script lang="ts">
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

  type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
    ref?: U | null;
  };

  type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes>;

  let {
    class: className,
    ref = $bindable(null),
    href = undefined,
    type = "button",
    disabled,
    children,
    ...restProps
  }: ButtonProps = $props();

  let buttonClass = $derived(`p-2 py-1 bg-black/70 hover:bg-black/90 rounded-md ${className}`);
</script>

{#if href}
  <a
    bind:this={ref}
    data-slot="button"
    class={buttonClass}
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    role={disabled ? "link" : undefined}
    tabindex={disabled ? -1 : undefined}
    {...restProps}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    bind:this={ref}
    data-slot="button"
    class={buttonClass}
    {type}
    {disabled}
    {...restProps}
  >
    {@render children?.()}
  </button>
{/if}
