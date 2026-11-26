<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	// Spark chip: coloured text with a small dot. No fill, no border.
	export const badgeVariants = tv({
		base: "inline-flex h-5 w-fit shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-bold before:size-1.5 before:shrink-0 before:rounded-full before:bg-current has-[>svg]:before:hidden [&>svg]:pointer-events-none [&>svg]:size-3.5",
		variants: {
			variant: {
				default: "text-foreground",
				secondary: "text-muted-foreground before:bg-faint",
				outline: "text-muted-foreground before:bg-faint",
				destructive: "text-destructive",
				signal: "text-spark-ink before:bg-spark",
				success: "text-success-text before:bg-success",
				// Ready to start: neutral text, green dot.
				ready: "text-muted-foreground before:bg-success",
				warning: "text-warning-text before:bg-warning",
				gold: "text-gold-text before:bg-gold",
				flame: "text-flame-text before:bg-flame",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
