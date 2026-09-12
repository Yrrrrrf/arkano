import {
	type Options as SvelteOptions,
	svelte,
} from "@sveltejs/vite-plugin-svelte";
import type { PluginOption } from "vite-plus";
import { type ArkanoPluginOptions, createArkanoCorePlugin } from "./plugin.ts";

export interface ArkanoCompositeOptions extends ArkanoPluginOptions {
	/** Optional configuration options forwarded to @sveltejs/vite-plugin-svelte */
	svelte?: SvelteOptions;
}

/**
 * Universal Arkano Vite 8 & Rolldown Plugin.
 *
 * Transparently composes @sveltejs/vite-plugin-svelte with Svelte 5 Runes mode enabled
 * by default alongside the Arkano zero-overhead bridge compiler and HMR boundary orchestrator.
 *
 * Consumers in React or Vue only need to add `arkano()` to their Vite plugins array;
 * the Svelte compilation toolchain is 100% assumed and pre-configured.
 */
export function arkano(options: ArkanoCompositeOptions = {}): PluginOption[] {
	return [
		svelte({
			configFile: false,
			compilerOptions: { runes: true },
			exclude: [/^\0/],
			...options.svelte,
		}) as PluginOption,
		createArkanoCorePlugin(options) as PluginOption,
	];
}

export * from "./plugin.ts";
export { createArkanoCorePlugin };
