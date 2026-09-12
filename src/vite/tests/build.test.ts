import tailwindcss from "@tailwindcss/vite";
import { build } from "vite";
import { describe, expect, it } from "vitest";
import { arkano } from "../src/index.ts";

const root = new URL("./fixtures/", import.meta.url).pathname;

describe("styled components in production", () => {
	it.each(["react", "vue"] as const)(
		"extracts CSS and resolves %s's canonical Svelte module",
		async (target) => {
			const result = await build({
				configFile: false,
				root,
				logLevel: "silent",
				plugins: [tailwindcss(), ...arkano({ target })],
				build: {
					write: false,
					minify: false,
					lib: {
						entry: `${root}entry.ts`,
						formats: ["es"],
						cssFileName: "style",
					},
					rolldownOptions: {
						external: ["react", "vue", "arkano/react", "arkano/vue"],
					},
				},
			});
			const outputs = (Array.isArray(result) ? result : [result]).flatMap(
				(bundle) => {
					if (!("output" in bundle))
						throw new Error("Expected build output, not a watcher");
					return bundle.output;
				},
			);
			const css = outputs.find(
				(file) => file.type === "asset" && file.fileName.endsWith(".css"),
			);
			expect(css).toBeDefined();
			if (css?.type === "asset") expect(String(css.source)).toContain("color");
			const js = outputs
				.filter((file) => file.type === "chunk")
				.map((file) => file.code)
				.join("\n");
			expect(js).toContain(`arkano/${target}`);
			expect(js).not.toContain("@arkano/");
			expect(js).not.toContain("?arkano-raw");
		},
	);
});
