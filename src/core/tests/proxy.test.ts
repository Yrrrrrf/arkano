import { describe, expect, it, vi } from "vitest";
import {
	createReactiveConduit,
	mountSvelteConduit,
	sanitizeProps,
} from "../src/proxy.svelte.ts";
import { createSyntheticSnippet } from "../src/snippets.ts";

describe("Reactive Conduit Engine", () => {
	it("creates a proxy with initial properties", () => {
		const conduit = createReactiveConduit({ count: 1, label: "test" });
		expect(conduit.proxy.count).toBe(1);
		expect(conduit.proxy.label).toBe("test");
	});

	it("mutates existing properties in-place without altering proxy identity", () => {
		const conduit = createReactiveConduit({ count: 1 });
		const initialProxyRef = conduit.proxy;

		conduit.reconcile({ count: 2 });
		expect(conduit.proxy.count).toBe(2);
		expect(conduit.proxy).toBe(initialProxyRef); // Identity preserved!
	});

	it("dynamically inserts newly added properties", () => {
		const conduit = createReactiveConduit<{ count: number; next?: string }>({
			count: 1,
		});
		conduit.reconcile({ count: 1, next: "added" });
		expect(conduit.proxy.count).toBe(1);
		expect(conduit.proxy.next).toBe("added");
	});

	it("cleanly deletes omitted properties from the proxy", () => {
		const conduit = createReactiveConduit<Record<string, unknown>>({
			a: 1,
			b: 2,
		});
		expect(conduit.proxy.a).toBe(1);
		expect(conduit.proxy.b).toBe(2);

		conduit.reconcile({ a: 1 });
		expect(conduit.proxy.a).toBe(1);
		expect("b" in conduit.proxy).toBe(false);
	});

	it("disposes all properties when conduit is terminated", () => {
		const conduit = createReactiveConduit({ count: 1, title: "hello" });
		conduit.dispose();
		expect(Object.keys(conduit.proxy).length).toBe(0);
	});

	it("notifies onBindableChange when proxy is mutated directly", () => {
		const onBindableChange = vi.fn();
		const conduit = createReactiveConduit(
			{ count: 0, title: "init" },
			{ onBindableChange },
		);

		conduit.proxy.count = 5;
		expect(onBindableChange).toHaveBeenCalledTimes(1);
		expect(onBindableChange).toHaveBeenCalledWith("count", 5);

		conduit.proxy.title = "updated";
		expect(onBindableChange).toHaveBeenCalledTimes(2);
		expect(onBindableChange).toHaveBeenCalledWith("title", "updated");
	});

	it("does not trigger onBindableChange during external reconcile()", () => {
		const onBindableChange = vi.fn();
		const conduit = createReactiveConduit({ count: 0 }, { onBindableChange });

		conduit.reconcile({ count: 10 });
		expect(conduit.proxy.count).toBe(10);
		expect(onBindableChange).not.toHaveBeenCalled();
	});

	it("preserves function children and snippets in sanitizeProps", () => {
		const snippet = createSyntheticSnippet(() => () => {});
		const sanitizedWithSnippet = sanitizeProps({
			count: 1,
			children: snippet,
		});
		expect(sanitizedWithSnippet.children).toBe(snippet);

		const sanitizedWithIgnored = sanitizeProps({
			count: 1,
			children: "plain text child",
		});
		expect("children" in sanitizedWithIgnored).toBe(false);
	});

	it("handles SSR and null target gracefully in mountSvelteConduit", () => {
		const fakeComponent = {};
		const bridge = mountSvelteConduit(fakeComponent, null, { initial: 1 });
		expect(bridge).toBeDefined();
		expect(bridge.conduit.proxy.initial).toBe(1);

		bridge.reconcile({ initial: 2 });
		expect(bridge.conduit.proxy.initial).toBe(2);

		expect(() => bridge.destroy()).not.toThrow();
	});
});
