// scripts/manifest.ts — Ephemeral npm package.json generator for publish
import { existsSync } from "@std/fs";
import { join } from "@std/path";

const root = Deno.cwd();
const denoJsonPath = join(root, "deno.json");
const pkgJsonPath = join(root, "package.json");

export function generateManifest(): Record<string, unknown> {
	const denoJson = JSON.parse(Deno.readTextFileSync(denoJsonPath));

	let author: string | undefined;
	if (Array.isArray(denoJson.authors) && denoJson.authors.length > 0) {
		author = denoJson.authors[0];
		if (author?.includes("<") && !author.endsWith(">")) {
			author = `${author}>`;
		}
	}

	const peerDependencies: Record<string, string> = {
		react: "^19.0.0",
		"react-dom": "^19.0.0",
		svelte: "^5.0.0",
		vite: "^8.0.0",
		vue: "^3.5.0",
	};

	const peerDependenciesMeta: Record<string, { optional: boolean }> = {
		react: { optional: true },
		"react-dom": { optional: true },
		vite: { optional: true },
		vue: { optional: true },
	};

	const dependencies: Record<string, string> = {
		arktype: "^2.0.0",
		"@sveltejs/vite-plugin-svelte": "^7.0.0",
	};

	const manifest = {
		name: denoJson.name,
		version: denoJson.version,
		description: denoJson.description,
		type: "module",
		main: "./dist/core/index.cjs",
		module: "./dist/core/index.mjs",
		types: "./dist/core/index.d.mts",
		exports: {
			".": {
				import: {
					types: "./dist/core/index.d.mts",
					default: "./dist/core/index.mjs",
				},
				require: {
					types: "./dist/core/index.d.cts",
					default: "./dist/core/index.cjs",
				},
			},
			"./react": {
				import: {
					types: "./dist/react/index.d.mts",
					default: "./dist/react/index.mjs",
				},
				require: {
					types: "./dist/react/index.d.cts",
					default: "./dist/react/index.cjs",
				},
			},
			"./vue": {
				import: {
					types: "./dist/vue/index.d.mts",
					default: "./dist/vue/index.mjs",
				},
				require: {
					types: "./dist/vue/index.d.cts",
					default: "./dist/vue/index.cjs",
				},
			},
			"./vite": {
				import: {
					types: "./dist/vite/index.d.mts",
					default: "./dist/vite/index.mjs",
				},
				require: {
					types: "./dist/vite/index.d.cts",
					default: "./dist/vite/index.cjs",
				},
			},
			"./vite/client": "./dist/vite/client.d.ts",
			"./cli": {
				import: {
					types: "./dist/cli/bin.d.mts",
					default: "./dist/cli/bin.mjs",
				},
				require: {
					types: "./dist/cli/bin.d.cts",
					default: "./dist/cli/bin.cjs",
				},
			},
			"./package.json": "./package.json",
		},
		files: ["dist", "README.md", "LICENSE"],
		author,
		license: denoJson.license,
		peerDependencies,
		peerDependenciesMeta,
		dependencies,
	};

	return manifest;
}

export function writeManifest(): void {
	const manifest = generateManifest();
	Deno.writeTextFileSync(pkgJsonPath, `${JSON.stringify(manifest, null, 2)}\n`);
	console.log("✔ Ephemeral package.json synthesized from deno.json");
}

export function removeManifest(): void {
	try {
		if (existsSync(pkgJsonPath)) {
			Deno.removeSync(pkgJsonPath);
			console.log(
				"✔ Ephemeral package.json removed (Deno exclusivity preserved)",
			);
		}
	} catch {
		// Ignore error if already removed
	}
}

if (import.meta.main) {
	const action = Deno.args[0] ?? "generate";
	if (action === "clean" || action === "rm") {
		removeManifest();
	} else if (action === "generate" || action === "write") {
		writeManifest();
	} else {
		console.error(`Unknown action: ${action}. Use 'generate' or 'clean'.`);
		Deno.exit(1);
	}
}
