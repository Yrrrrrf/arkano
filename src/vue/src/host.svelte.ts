import {
	defineComponent,
	h,
	onMounted,
	onUnmounted,
	ref,
	watch,
	type PropType,
} from "vue";
import type { mount } from "svelte";
import { mountSvelteConduit, type MountedConduit } from "@arkane/core";
import type { SupportedVueHostTag } from "./types.ts";

/**
 * Arkane Host for Vue 3.5.
 * Mounts a Svelte 5 component inside a layout-invisible container with deep attribute synchronization.
 */
export const Arkane = defineComponent({
	name: "ArkaneVueHost",
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

export { Arkane as Svelte };
