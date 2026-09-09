import type { DevEnvironment, HotUpdateOptions, ResolvedConfig } from "vite";
import { describe, expect, it, vi } from "vitest";
import { arkano, createArkanoCorePlugin } from "../src/index.ts";

describe("@arkano/vite Plugin", () => {
	it("composes @sveltejs/vite-plugin-svelte and core arkano plugin in arkano()", () => {
		const plugins = arkano({ target: "react" });
		expect(Array.isArray(plugins)).toBe(true);
		expect(plugins.length).toBeGreaterThanOrEqual(2);
	});

	it("resolves direct .svelte imports from .tsx to \\0arkano:react:...", async () => {
		const plugin = createArkanoCorePlugin({ target: "react" });
		const resolveId = (
			plugin.resolveId as {
				handler: (
					source: string,
					importer?: string,
				) => Promise<string | null | undefined>;
			}
		).handler;

		const resolved = await resolveId(
			"/workspace/Counter.svelte",
			"/workspace/App.tsx",
		);
		expect(resolved).toBe("\0arkano:react:/workspace/Counter.svelte");
	});

	it("passes through sub-component imports with importer ending in .svelte", async () => {
		const plugin = createArkanoCorePlugin({ target: "react" });
		const resolveId = (
			plugin.resolveId as {
				handler: (
					source: string,
					importer?: string,
				) => Promise<string | null | undefined>;
			}
		).handler;

		const resolved = await resolveId(
			"./Button.svelte",
			"/workspace/Counter.svelte",
		);
		expect(resolved).toBeNull();
	});

	it("passes through internal ?arkano-raw queries", async () => {
		const plugin = createArkanoCorePlugin({ target: "react" });
		const resolveId = (
			plugin.resolveId as {
				handler: (
					source: string,
					importer?: string,
				) => Promise<string | null | undefined>;
			}
		).handler;

		const resolved = await resolveId(
			"/workspace/Counter.svelte?arkano-raw",
			"/workspace/App.tsx",
		);
		expect(resolved).toBeNull();
	});

	it("auto-detects target framework from configResolved plugins", async () => {
		const vuePlugin = createArkanoCorePlugin();
		const configResolved = vuePlugin.configResolved as (
			config: ResolvedConfig,
		) => void;
		configResolved({
			plugins: [{ name: "vite:vue" }],
		} as unknown as ResolvedConfig);

		const resolveId = (
			vuePlugin.resolveId as {
				handler: (
					source: string,
					importer?: string,
				) => Promise<string | null | undefined>;
			}
		).handler;

		const resolved = await resolveId(
			"/workspace/Counter.svelte",
			"/workspace/App.vue",
		);
		expect(resolved).toBe("\0arkano:vue:/workspace/Counter.svelte");
	});

	it("emits valid React Function Component ArkanoReactBridge in load hook", () => {
		const plugin = createArkanoCorePlugin({ target: "react" });
		const load = (
			plugin.load as {
				handler: (id: string) => string | null;
			}
		).handler;

		const code = load("\0arkano:react:/workspace/Counter.svelte");
		expect(code).not.toBeNull();
		expect(code).toContain("import React from 'react';");
		expect(code).toContain("import { Arkano } from '@arkano/react';");
		expect(code).toContain(
			"import SvelteComponent from '/workspace/Counter.svelte?arkano-raw';",
		);
		expect(code).toContain(
			"export default function ArkanoReactBridge(props) {",
		);
		expect(code).toContain(
			"return React.createElement(Arkano, { this: SvelteComponent, ...props });",
		);
		expect(code).toContain(
			"export * from '/workspace/Counter.svelte?arkano-raw';",
		);
	});

	it("emits valid Vue defineComponent ArkanoVueBridge in load hook", () => {
		const plugin = createArkanoCorePlugin({ target: "vue" });
		const load = (
			plugin.load as {
				handler: (id: string) => string | null;
			}
		).handler;

		const code = load("\0arkano:vue:/workspace/Counter.svelte");
		expect(code).not.toBeNull();
		expect(code).toContain("import { defineComponent, h } from 'vue';");
		expect(code).toContain("import { Arkano } from '@arkano/vue';");
		expect(code).toContain(
			"import SvelteComponent from '/workspace/Counter.svelte?arkano-raw';",
		);
		expect(code).toContain("name: 'ArkanoVueBridge'");
		expect(code).toContain(
			"return () => h(Arkano, { this: SvelteComponent, ...attrs }, slots);",
		);
		expect(code).toContain(
			"export * from '/workspace/Counter.svelte?arkano-raw';",
		);
	});

	it("isolates HMR invalidation in hotUpdate and emits custom arkano:hmr-reload", () => {
		const plugin = createArkanoCorePlugin();
		const invalidateModule = vi.fn();
		const send = vi.fn();

		const mockAdapterMod = {
			id: "\0arkano:react:/workspace/Counter.svelte",
		};
		const mockUnrelatedMod = {
			id: "\0arkano:react:/workspace/Other.svelte",
		};

		const mockDevEnv = {
			moduleGraph: {
				idToModuleMap: new Map([
					["mod1", mockAdapterMod],
					["mod2", mockUnrelatedMod],
				]),
				invalidateModule,
			},
			hot: {
				send,
			},
		} as unknown as DevEnvironment;

		const hotUpdate = plugin.hotUpdate as (
			this: { environment: DevEnvironment },
			options: HotUpdateOptions,
		) => unknown[];

		const mockModules = [{ id: "/workspace/Counter.svelte" }];
		const result = hotUpdate.call({ environment: mockDevEnv }, {
			file: "/workspace/Counter.svelte",
			modules: mockModules as unknown as HotUpdateOptions["modules"],
			timestamp: 12345678,
		} as unknown as HotUpdateOptions);

		expect(invalidateModule).toHaveBeenCalledTimes(1);
		expect(invalidateModule).toHaveBeenCalledWith(mockAdapterMod);
		expect(send).toHaveBeenCalledWith({
			type: "custom",
			event: "arkano:hmr-reload",
			data: { file: "/workspace/Counter.svelte", timestamp: 12345678 },
		});
		expect(result).toEqual([mockAdapterMod]);
	});

	it("passes through non-svelte file hotUpdate without module invalidation", () => {
		const plugin = createArkanoCorePlugin();
		const invalidateModule = vi.fn();
		const send = vi.fn();

		const mockDevEnv = {
			moduleGraph: {
				idToModuleMap: new Map(),
				invalidateModule,
			},
			hot: {
				send,
			},
		} as unknown as DevEnvironment;

		const hotUpdate = plugin.hotUpdate as (
			this: { environment: DevEnvironment },
			options: HotUpdateOptions,
		) => unknown[];

		const mockModules = [{ id: "/workspace/App.tsx" }];
		const result = hotUpdate.call({ environment: mockDevEnv }, {
			file: "/workspace/App.tsx",
			modules: mockModules as unknown as HotUpdateOptions["modules"],
			timestamp: 12345678,
		} as unknown as HotUpdateOptions);

		expect(invalidateModule).not.toHaveBeenCalled();
		expect(send).not.toHaveBeenCalled();
		expect(result).toBe(mockModules);
	});
});
