import { mount as mountVue } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
// @ts-expect-error - Svelte fixture import
import Counter from "../../../fixtures/components/Counter.svelte";
import { Arkane } from "../src/host.svelte.ts";

describe("Vue 3.5 <Arkane /> Host", () => {
	it("renders with layout-invisible display: contents container", () => {
		const wrapper = mountVue(Arkane, {
			props: {
				this: Counter,
				as: "span",
			},
			attrs: {
				initial: 0,
			},
		});

		const hostSpan = wrapper.find("span");
		expect(hostSpan.exists()).toBe(true);
		expect(hostSpan.attributes("style")).toContain("display: contents");
	});

	it("updates props fine-grained via deep watcher without remounting", async () => {
		const count = ref(1);
		const wrapper = mountVue({
			components: { Arkane },
			setup() {
				return { Counter, count };
			},
			template: '<Arkane :this="Counter" :count="count" />',
		});

		expect(wrapper.text()).toContain("1");

		// Mutate reactive Vue ref
		count.value = 5;
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain("5");
	});

	it("propagates Svelte bindable mutations to Vue update:prop listeners", async () => {
		const onUpdateCount = vi.fn();
		const wrapper = mountVue(Arkane, {
			props: {
				this: Counter,
			},
			attrs: {
				initial: 0,
				"onUpdate:count": onUpdateCount,
			},
		});

		const incrementBtn = wrapper
			.findAll("button")
			.find((b) => b.text().includes("Increment"));
		expect(incrementBtn).toBeDefined();
		await incrementBtn?.trigger("click");

		expect(onUpdateCount).toHaveBeenCalledWith(1);
	});

	it("unmounts cleanly and invokes Svelte unmount", () => {
		const wrapper = mountVue(Arkane, {
			props: {
				this: Counter,
			},
		});
		expect(wrapper.exists()).toBe(true);
		wrapper.unmount();
		expect(wrapper.element.parentElement).toBeNull();
	});
});
