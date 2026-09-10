import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { arkano, defineGWA, type PluginOption } from "../app.config.ts";

const globalEnv = globalThis as unknown as {
	Deno?: { env: { get: (key: string) => string | undefined } };
	process?: { env?: Record<string, string> };
};

const rawBase =
	globalEnv.Deno?.env?.get("BASE_PATH") ??
	globalEnv.process?.env?.BASE_PATH ??
	"";
const base = rawBase
	? rawBase.endsWith("/")
		? rawBase.slice(0, -1)
		: rawBase
	: "";

export default defineGWA({
	plugins: [
		sveltekit({
			adapter: adapter({
				fallback: "index.html",
				strict: true,
			}),
			paths: {
				base,
			},
		}) as PluginOption,
	],
	overrides: {
		test: {
			name: "app:svelte",
		},
	},
});
