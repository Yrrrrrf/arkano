import { afterAll, describe, expect, it } from "vitest";
import { emitWrapper } from "../src/emitter.ts";

const TEST_OUT_DIR = "./dist/test-adapters";

describe("@arkano/cli Emitter", () => {
	afterAll(async () => {
		try {
			await Deno.remove(TEST_OUT_DIR, { recursive: true });
		} catch {
			// Ignored
		}
	});

	it("emits a valid React .tsx adapter file with binding callbacks for $bindable() props", async () => {
		const emittedPath = await emitWrapper({
			componentPath: "/root/components/Counter.svelte",
			componentName: "Counter",
			outputDir: `${TEST_OUT_DIR}/react`,
			target: "react",
			bindableProps: ["count"],
		});

		const fileContent = await Deno.readTextFile(emittedPath);
		expect(fileContent).toContain("import { arkano } from 'arkano/react'");
		expect(fileContent).toContain(
			"export const Counter = arkano(SvelteCounter)",
		);
		expect(fileContent).toContain("onCountChange?: (value: any) => void;");
		expect(fileContent).toContain("export default Counter");
	});

	it("emits a valid Vue .ts adapter file with onUpdate event definitions for $bindable() props", async () => {
		const emittedPath = await emitWrapper({
			componentPath: "/root/components/Counter.svelte",
			componentName: "Counter",
			outputDir: `${TEST_OUT_DIR}/vue`,
			target: "vue",
			bindableProps: ["count"],
		});

		const fileContent = await Deno.readTextFile(emittedPath);
		expect(fileContent).toContain("import { arkano } from 'arkano/vue'");
		expect(fileContent).toContain(
			"export const Counter = arkano(SvelteCounter)",
		);
		expect(fileContent).toContain("'onUpdate:count'?: (value: any) => void;");
		expect(fileContent).toContain("export default Counter");
	});
});
