import { createPropValidator } from "@arkano/core";
import type { mount } from "svelte";
import { defineComponent, h } from "vue";
import { Arkano } from "./host.svelte.ts";
import type { ArkanoVueAdapterOptions } from "./types.ts";

/**
 * Wraps a Svelte 5 component into a native Vue 3.5 component.
 */
export function arkano<C extends Parameters<typeof mount>[0]>(
	SvelteComponent: C,
	options?: ArkanoVueAdapterOptions,
): ReturnType<typeof defineComponent> {
	const validator = options?.schema
		? createPropValidator(options.schema)
		: null;
	const name = (SvelteComponent as { name?: string }).name || "SvelteComponent";

	return defineComponent({
		name: `arkano(${name})`,
		inheritAttrs: false,
		setup(_, { attrs, slots }) {
			if (validator) {
				validator(attrs);
			}
			return () =>
				h(
					Arkano,
					{
						this: SvelteComponent,
						as: options?.as ?? "span",
						...attrs,
					},
					slots,
				);
		},
	});
}
