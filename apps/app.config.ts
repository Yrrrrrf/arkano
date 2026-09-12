import tailwindcss from "@tailwindcss/vite";
import {
	defineConfig,
	type PluginOption,
	searchForWorkspaceRoot,
	type UserConfig,
} from "vite-plus";

const SRC_ROOT = new URL("../src", import.meta.url).pathname;
const FIXTURES_ROOT = new URL("../fixtures", import.meta.url).pathname;

export interface GwaConfig {
	plugins?: PluginOption[];
	extraPlugins?: PluginOption[];
	overrides?: UserConfig;
}

export function defineGWA(options: GwaConfig = {}) {
	const { plugins = [], extraPlugins = [], overrides = {} } = options;
	const rootPath =
		(import.meta as unknown as { dirname?: string }).dirname ??
		new URL("..", import.meta.url).pathname;
	const workspaceRoot = searchForWorkspaceRoot(rootPath);
	const { server: overrideServer, ...restOverrides } = overrides;

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
			? rawBase
			: `${rawBase}/`
		: undefined;

	return defineConfig({
		base,
		server: {
			fs: {
				allow: [workspaceRoot],
				...(overrideServer?.fs ?? {}),
			},
			watch: {
				ignored: ["!**/fixtures/**", "!**/src/**"],
				...(overrideServer?.watch ?? {}),
			},
			...(overrideServer ?? {}),
		},
		resolve: {
			alias: [
				{ find: /^arkano$/, replacement: `${SRC_ROOT}/core/src/index.ts` },
				{
					find: /^arkano\/(react|vue|vite)$/,
					replacement: `${SRC_ROOT}/$1/src/index.ts`,
				},
				{
					find: /^@sdk\/ui$/,
					replacement: `${FIXTURES_ROOT}/components/mod.ts`,
				},
				{
					find: /^@sdk\/ui\/(.*)/,
					replacement: `${FIXTURES_ROOT}/components/$1`,
				},
				{
					find: /^@arkano\/([^/]+)$/,
					replacement: `${SRC_ROOT}/$1/src/index.ts`,
				},
				{ find: /^@arkano\/(.*)/, replacement: `${SRC_ROOT}/$1` },
				{ find: /^#fixtures\/(.*)/, replacement: `${FIXTURES_ROOT}/$1` },
				{ find: /^#lib\/(.*)/, replacement: "/src/lib/$1" },
				{ find: /^#lib$/, replacement: "/src/lib/mod.ts" },
			],
		},
		plugins: [tailwindcss() as PluginOption, ...plugins, ...extraPlugins],
		ssr: {
			noExternal: ["rune-lab"],
		},
		...restOverrides,
	});
}

export { arkano } from "../src/vite/src/index.ts";
export const defineArkanoApp = defineGWA;
export default defineGWA();
export type { PluginOption };
