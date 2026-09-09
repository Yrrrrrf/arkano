import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
// @ts-expect-error - Svelte fixture import
import Counter from "../../../fixtures/components/Counter.svelte";
import { arkano } from "../src/adapter.svelte.ts";

describe("React 19 arkano() HOC", () => {
	it("creates an idiomatic React component with displayName", () => {
		const ReactCounter = arkano(Counter);
		expect(ReactCounter.displayName).toContain("arkano(");

		render(<ReactCounter initial={42} />);
		expect(screen.getByText("42")).not.toBeNull();
	});

	it("creates an idiomatic React component supporting custom options", () => {
		const ReactCounter = arkano(Counter, {
			as: "div",
			className: "custom-counter",
		});
		render(<ReactCounter initial={100} />);
		expect(screen.getByText("100")).not.toBeNull();
	});
});
