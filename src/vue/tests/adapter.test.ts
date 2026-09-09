import { mount as mountVue } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
// @ts-expect-error - Svelte fixture import
import Counter from "../../../fixtures/components/Counter.svelte";
import { arkano } from "../src/adapter.svelte.ts";

describe("Vue 3.5 arkano() HOC", () => {
	it("creates an idiomatic Vue component with displayName", () => {
		const VueCounter = arkano(Counter);
		expect(VueCounter.name).toContain("arkano(");

		const wrapper = mountVue(VueCounter, {
			attrs: {
				initial: 42,
			},
		});

		expect(wrapper.text()).toContain("42");
	});

	it("creates an idiomatic Vue component supporting custom options", () => {
		const VueCounter = arkano(Counter, { as: "div" });
		const wrapper = mountVue(VueCounter, {
			attrs: {
				initial: 99,
			},
		});

		expect(wrapper.text()).toContain("99");
	});
});
