import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		"core/index": "src/core/src/index.ts",
		"react/index": "src/react/src/index.ts",
		"vue/index": "src/vue/src/index.ts",
		"vite/index": "src/vite/src/index.ts",
		"cli/bin": "src/cli/src/bin.ts",
	},
	format: ["esm", "cjs"],
	dts: {
		isolatedDeclarations: true,
	},
	clean: true,
	bundleless: false,
	platform: "neutral",
	copy: [
		{
			from: "src/vite/client.d.ts",
			to: "dist/vite",
		},
	],
	deps: {
		neverBundle: [
			"svelte",
			"react",
			"react-dom",
			"vue",
			"vite",
			"@sveltejs/vite-plugin-svelte",
			"arktype",
			"@cliffy/command",
			"@cliffy/table",
			"@cliffy/ansi",
			"@cliffy/ansi/colors",
			"rolldown",
			"rolldown/filter",
			"@std/fs",
			"@std/path",
			"@std/streams",
			"@std/assert",
			"@arkano/core",
			"@arkano/react",
			"@arkano/vue",
		],
	},
});
