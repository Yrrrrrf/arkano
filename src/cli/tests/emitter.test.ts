import { describe, expect, it, afterAll } from "vitest";
import { emitWrapper } from "../src/emitter.ts";

const TEST_OUT_DIR = "./dist/test-adapters";

describe("@arkane/cli Emitter", () => {
	afterAll(async () => {
		try {
			await Deno.remove(TEST_OUT_DIR, { recursive: true });
		} catch {
			// Ignored
		}
	});

	it("emits a valid React .tsx adapter file", async () => {
		const emittedPath = await emitWrapper({
			componentPath: "/root/components/Counter.svelte",
			componentName: "Counter",
			outputDir: `${TEST_OUT_DIR}/react`,
			target: "react",
		});

		const fileContent = await Deno.readTextFile(emittedPath);
		expect(fileContent).toContain("import { arkane } from '@arkane/react'");
		expect(fileContent).toContain(
			"export const Counter = arkane(SvelteCounter)",
		);
		expect(fileContent).toContain("export default Counter");
	});

	it("emits a valid Vue .ts adapter file", async () => {
		const emittedPath = await emitWrapper({
			componentPath: "/root/components/Counter.svelte",
			componentName: "Counter",
			outputDir: `${TEST_OUT_DIR}/vue`,
			target: "vue",
		});

		const fileContent = await Deno.readTextFile(emittedPath);
		expect(fileContent).toContain("import { arkane } from '@arkane/vue'");
		expect(fileContent).toContain(
			"export const Counter = arkane(SvelteCounter)",
		);
		expect(fileContent).toContain("export default Counter");
	});
});
