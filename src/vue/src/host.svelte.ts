import { type MountedConduit, mountSvelteConduit } from "@arkano/core";
import type { mount } from "svelte";
import {
	defineComponent,
	h,
	onMounted,
	onUnmounted,
	type PropType,
	ref,
	watch,
} from "vue";
import type { SupportedVueHostTag } from "./types.ts";

/**
 * Arkano Host for Vue 3.5.
 * Mounts a Svelte 5 component inside a layout-invisible container with deep attribute synchronization.
 */
export const Arkano = defineComponent({
	name: "ArkanoVueHost",
	props: {
		this: {
			type: [Object, Function] as PropType<Parameters<typeof mount>[0]>,
			required: true,
		},
		as: {
			type: String as PropType<SupportedVueHostTag>,
			default: "span",
		},
	},
	inheritAttrs: false,
	setup(props, { attrs }) {
		const containerRef = ref<HTMLElement | null>(null);
		let bridge: MountedConduit | null = null;

		onMounted(() => {
			if (!containerRef.value) return;

			bridge = mountSvelteConduit(
				props.this,
				containerRef.value,
				attrs as Record<string, unknown>,
				{
					onBindableChange(key: string, value: unknown) {
						const currentAttrs = attrs as Record<string, unknown>;
						const updateHandler = currentAttrs[`onUpdate:${key}`];
						if (typeof updateHandler === "function") {
							(updateHandler as (val: unknown) => void)(value);
						}
						if (key === "value") {
							const modelUpdate = currentAttrs["onUpdate:modelValue"];
							if (typeof modelUpdate === "function") {
								(modelUpdate as (val: unknown) => void)(value);
							}
						}
						if (key === "value" || key === "modelValue") {
							const changeHandler =
								currentAttrs.onChange ?? currentAttrs.onchange;
							if (typeof changeHandler === "function") {
								(changeHandler as (val: unknown) => void)(value);
							}
						}
					},
				},
			);
		});

		// Deep attribute synchronization without DOM remount
		watch(
			() => ({ ...attrs }),
			(newAttrs) => {
				if (bridge) {
					bridge.reconcile(newAttrs as Record<string, unknown>);
				}
			},
			{ deep: true },
		);

		onUnmounted(() => {
			if (bridge) {
				bridge.destroy();
				bridge = null;
			}
		});

		return () =>
			h(props.as, {
				ref: containerRef,
				style: { display: "contents" },
			});
	},
});

export { Arkano as Svelte };
