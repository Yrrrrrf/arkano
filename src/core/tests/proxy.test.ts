import { describe, expect, it } from "vitest";
import { createReactiveConduit } from "../src/proxy.svelte.ts";

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
});
