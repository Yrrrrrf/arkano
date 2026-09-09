import {
	svelte,
	type Options as SvelteOptions,
} from "@sveltejs/vite-plugin-svelte";
import type { PluginOption } from "vite";
import { createArkaneCorePlugin, type ArkanePluginOptions } from "./plugin.ts";

export interface ArkaneCompositeOptions extends ArkanePluginOptions {
	/** Optional configuration options forwarded to @sveltejs/vite-plugin-svelte */
	svelte?: SvelteOptions;
}

/**
 * Universal Arkane Vite 8 & Rolldown Plugin.
 *
 * Transparently composes @sveltejs/vite-plugin-svelte with Svelte 5 Runes mode enabled
 * by default alongside the Arkane zero-overhead bridge compiler and HMR boundary orchestrator.
 *
 * Consumers in React or Vue only need to add `arkane()` to their Vite plugins array;
 * the Svelte compilation toolchain is 100% assumed and pre-configured.
 */
export function arkane(options: ArkaneCompositeOptions = {}): PluginOption[] {
	return [
		svelte({
			compilerOptions: { runes: true },
			exclude: [/^\0/],
			...options.svelte,
		}) as PluginOption,
		createArkaneCorePlugin(options) as PluginOption,
	];
}

export { createArkaneCorePlugin };
export * from "./plugin.ts";
export * from "./hmr.ts";
