import { describe, expect, it, vi } from "vite-plus/test";
import { createArkanoCorePlugin } from "../src/plugin.ts";

function hooks(options: Parameters<typeof createArkanoCorePlugin>[0] = {}) {
	const plugin = createArkanoCorePlugin(options);
	const context = {
		resolve: vi.fn(async (id: string) => ({ id, external: false })),
	};
	const resolveHook = plugin.resolveId as {
		handler: (
			this: typeof context,
			source: string,
			importer?: string,
		) => Promise<unknown>;
	};
	const resolve = (source: string, importer = "/app/App.tsx") =>
		resolveHook.handler.call(context, source, importer);
	const loadHook = plugin.load as {
		handler: (id: string) => string | null | undefined;
	};
	const load = (id: string) => loadHook.handler(id);
	return { plugin, context, resolve, load };
}

describe("arkano/vite resolution", () => {
	it.each(["react", "vue"] as const)(
		"emits public %s imports and canonical component IDs",
		async (target) => {
			const { resolve, load } = hooks({ target });
			const id = await resolve("/app/Styled.svelte");
			expect(id).toBe(`\0arkano:${target}:/app/Styled.svelte`);
			const code = load(id);
			expect(code).toContain(`from 'arkano/${target}'`);
			expect(code).toContain('from "/app/Styled.svelte"');
			expect(code).not.toContain("@arkano/");
			expect(code).not.toContain("?arkano-raw");
		},
	);
	it.each([
		"?svelte&type=style&lang.css",
		"?raw",
		"?url",
		"?direct",
		"?other=value",
		"?target=invalid",
	])("preserves %s", async (query) => {
		const { resolve, context } = hooks();
		expect(await resolve(`/app/Styled.svelte${query}`)).toBeNull();
		expect(context.resolve).not.toHaveBeenCalled();
	});
	it("canonicalizes explicit raw imports before Svelte sees them", async () => {
		const { resolve, context } = hooks();
		expect(await resolve("/app/Styled.svelte?arkano-raw")).toEqual({
			id: "/app/Styled.svelte",
			external: false,
		});
		expect(context.resolve).toHaveBeenCalledWith(
			"/app/Styled.svelte",
			"/app/App.tsx",
			{ skipSelf: true },
		);
	});
	it.each(["/app/Parent.svelte", "\0arkano:react:/app/Parent.svelte"])(
		"preserves native imports from %s",
		async (importer) => {
			expect(await hooks().resolve("/app/Child.svelte", importer)).toBeNull();
		},
	);
	it("keeps third-party Svelte barrels native", async () => {
		expect(
			await hooks().resolve(
				"/app/node_modules/ui/Button.svelte",
				"/app/node_modules/ui/index.js",
			),
		).toBeNull();
	});
	it("honors include against resolved paths", async () => {
		const { resolve } = hooks({ include: /\/sdk\/ui\// });
		expect(await resolve("/app/Other.svelte")).toBeNull();
		expect(await resolve("/app/sdk/ui/Button.svelte")).toContain(
			"arkano:react:",
		);
	});
	it("does not contain fixture-specific production exceptions", async () => {
		expect(
			await hooks().resolve(
				"/app/Button.svelte",
				"/app/fixtures/components/mod.ts",
			),
		).toContain("arkano:react:");
	});
	it("escapes JavaScript module paths", () => {
		const code = hooks().load("\0arkano:react:/app/Bob's Button.svelte");
		expect(code).toContain(JSON.stringify("/app/Bob's Button.svelte"));
	});
	it("supports an explicit Vue target query", async () => {
		expect(await hooks().resolve("/app/Button.svelte?target=vue")).toBe(
			"\0arkano:vue:/app/Button.svelte",
		);
	});
	it("detects Vue without mutating Svelte plugin options", () => {
		const { plugin, load } = hooks();
		const api = Object.freeze({
			options: Object.freeze({ exclude: Object.freeze([]) }),
		});
		const configResolved = plugin.configResolved as unknown as (
			config: unknown,
		) => void;
		configResolved({
			root: "/app",
			plugins: [{ name: "vite:vue" }, { name: "vite-plugin-svelte", api }],
		});
		expect(load("\0arkano:vue:/app/Button.svelte")).toContain("arkano/vue");
	});
	it("retains native CSS HMR modules and matches exact component paths", () => {
		const { plugin } = hooks();
		const adapter = { id: "\0arkano:react:/app/Counter.svelte" };
		const unrelated = { id: "\0arkano:react:/prefix/app/Counter.svelte" };
		const css = { id: "/app/Counter.svelte?svelte&type=style&lang.css" };
		const environment = {
			moduleGraph: {
				idToModuleMap: new Map([
					["a", adapter],
					["b", unrelated],
				]),
				invalidateModule: vi.fn(),
			},
		};
		const hotUpdate = plugin.hotUpdate as unknown as (
			this: { environment: unknown },
			options: unknown,
		) => unknown[];
		const modules = hotUpdate.call(
			{ environment },
			{ file: "/app/Counter.svelte", modules: [css], timestamp: 1 },
		);
		expect(modules).toEqual([css, adapter]);
		expect(environment.moduleGraph.invalidateModule).toHaveBeenCalledTimes(1);
	});
});
