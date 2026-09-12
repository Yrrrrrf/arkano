import { assertEquals, assertNotMatch } from "@std/assert";
import { resolve, toFileUrl } from "@std/path";
import { generateManifest } from "./manifest.ts";

const root = resolve(".");
const manifest = generateManifest() as {
	exports: Record<
		string,
		| string
		| {
				import: { types: string; default: string };
				require: { types: string; default: string };
		  }
	>;
};
for (const [name, target] of Object.entries(manifest.exports)) {
	if (name === "./package.json") continue; // Generated only for packaging.
	const paths =
		typeof target === "string"
			? [target]
			: [
					target.import.types,
					target.import.default,
					target.require.types,
					target.require.default,
				];
	for (const path of paths) await Deno.stat(resolve(root, path));
}

async function checkModules(dir: string): Promise<void> {
	for await (const entry of Deno.readDir(dir)) {
		const path = resolve(dir, entry.name);
		if (entry.isDirectory) await checkModules(path);
		else if (/\.(?:[mc]?js|[mc]?ts)$/.test(entry.name)) {
			assertNotMatch(
				await Deno.readTextFile(path),
				/@arkano\//,
				`Private import leaked into ${path}`,
			);
		}
	}
}
await checkModules(resolve(root, "dist"));
for (const entry of ["core", "react", "vue", "vite"]) {
	await import(toFileUrl(resolve(root, `dist/${entry}/index.mjs`)).href);
	await import(toFileUrl(resolve(root, `dist/${entry}/index.cjs`)).href);
}
const { createReactiveConduit } = await import(
	toFileUrl(resolve(root, "dist/core/index.mjs")).href
);
const conduit = createReactiveConduit({ count: 1 });
conduit.reconcile({ count: 2 });
assertEquals(conduit.proxy.count, 2);
conduit.dispose();
console.log(
	"Distribution verified: exports, public imports, ESM/CJS, and compiled reactive core.",
);
