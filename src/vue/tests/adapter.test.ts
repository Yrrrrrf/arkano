import { describe, expect, it } from "vitest";
import { mount as mountVue } from "@vue/test-utils";
import { arkane, toVue } from "../src/adapter.svelte.ts";
// @ts-expect-error - Svelte fixture import
import Counter from "../../../fixtures/components/Counter.svelte";

describe("Vue 3.5 arkane() / toVue() HOC", () => {
	it("creates an idiomatic Vue component with displayName", () => {
		const VueCounter = arkane(Counter);
		expect(VueCounter.name).toContain("arkane(");

		const wrapper = mountVue(VueCounter, {
			attrs: {
				initial: 42,
			},
		});

		expect(wrapper.text()).toContain("42");
	});

	it("toVue alias works identically", () => {
		const VueCounter = toVue(Counter);
		const wrapper = mountVue(VueCounter, {
			attrs: {
				initial: 99,
			},
		});

		expect(wrapper.text()).toContain("99");
	});
});
