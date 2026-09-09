import { describe, expect, it } from "vitest";
import { arkane } from "../src/plugin.ts";

describe("@arkane/vite Plugin", () => {
	it("resolves ?arkane query parameters", () => {
		const plugin = arkane({ target: "react" });
		const resolved = (plugin.resolveId as Function)(
			"/src/Counter.svelte?arkane",
		);
		expect(resolved).toBe("/src/Counter.svelte?arkane");
	});

	it("ignores non-arkane imports", () => {
		const plugin = arkane();
		const resolved = (plugin.resolveId as Function)("/src/Counter.svelte");
		expect(resolved).toBeNull();
	});

	it("transforms React query to @arkane/react adapter module", async () => {
		const plugin = arkane({ target: "react" });
		const result = await (plugin.transform as Function)(
			"",
			"/workspace/Counter.svelte?arkane",
		);
		expect(result).not.toBeNull();
		expect(result.code).toContain("import { arkane } from '@arkane/react'");
		expect(result.code).toContain(
			"import SvelteComponent from '/workspace/Counter.svelte'",
		);
		expect(result.code).toContain("export default arkane(SvelteComponent)");
	});

	it("transforms Vue query to @arkane/vue adapter module", async () => {
		const plugin = arkane({ target: "react" });
		const result = await (plugin.transform as Function)(
			"",
			"/workspace/Counter.svelte?arkane&target=vue",
		);
		expect(result).not.toBeNull();
		expect(result.code).toContain("import { arkane } from '@arkane/vue'");
		expect(result.code).toContain("export default arkane(SvelteComponent)");
	});
});
