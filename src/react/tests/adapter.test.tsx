import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
// @ts-expect-error - Svelte fixture import
import Counter from "../../../fixtures/components/Counter.svelte";
import { arkane } from "../src/adapter.svelte.ts";

describe("React 19 arkane() HOC", () => {
	it("creates an idiomatic React component with displayName", () => {
		const ReactCounter = arkane(Counter);
		expect(ReactCounter.displayName).toContain("arkane(");

		render(<ReactCounter initial={42} />);
		expect(screen.getByText("42")).not.toBeNull();
	});

	it("creates an idiomatic React component supporting custom options", () => {
		const ReactCounter = arkane(Counter, {
			as: "div",
			className: "custom-counter",
		});
		render(<ReactCounter initial={100} />);
		expect(screen.getByText("100")).not.toBeNull();
	});
});
