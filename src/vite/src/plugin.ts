import { prefixRegex } from "rolldown/filter";
import type {
	DevEnvironment,
	HotUpdateOptions,
	Plugin,
	ResolvedConfig,
} from "vite";

export interface ArkanoPluginOptions {
	/** Target framework to adapt to: 'react', 'vue', or 'auto'. Defaults to 'auto' */
	target?: "react" | "vue" | "auto";
	/** Glob pattern for auto-wrapping Svelte components without query params */
	include?: string | RegExp | Array<string | RegExp>;
}

/**
 * Arkano Vite 8 & Rolldown Compiler Plugin.
 *
 * Transparently bridges Svelte 5 Runes into React 19 and Vue 3.5 host applications.
 *
 * Features:
 * - Rolldown native Rust hook filters (`filter.id`) for zero-overhead native resolution.
 * - Named AST-compliant React Function Components (`ArkanoReactBridge`) and Vue `defineComponent` (`ArkanoVueBridge`).
 * - Recursion guard: Svelte sub-components and internal Svelte virtual queries remain pure Svelte.
 * - Vite 8 Environment API `hotUpdate` isolating HMR invalidations to virtual adapter boundaries.
 */
export function createArkanoCorePlugin(
	options: ArkanoPluginOptions = {},
): Plugin {
	let targetFramework: "react" | "vue" =
		options.target && options.target !== "auto" ? options.target : "react";
	let _config: ResolvedConfig | undefined;

	return {
		name: "vite-plugin-arkano",
		enforce: "pre", // Intercepts .svelte imports before @sveltejs/vite-plugin-svelte

		configResolved(resolvedConfig) {
			_config = resolvedConfig;
			if (options.target && options.target !== "auto") {
				targetFramework = options.target;
			} else {
				const pluginNames = new Set(resolvedConfig.plugins.map((p) => p.name));
				if (
					pluginNames.has("vite:vue") ||
					pluginNames.has("@vitejs/plugin-vue")
				) {
					targetFramework = "vue";
				} else {
					targetFramework = "react";
				}
			}

			// Ensure @sveltejs/vite-plugin-svelte excludes \0 virtual modules from AST compilation
			for (const p of resolvedConfig.plugins) {
				if (p.name?.startsWith("vite-plugin-svelte")) {
					const api = (
						p as unknown as {
							api?: {
								options?: { exclude?: Array<string | RegExp> };
								filter?: { id?: { exclude?: Array<string | RegExp> } };
							};
						}
					).api;
					if (api?.options) {
						if (!api.options.exclude) api.options.exclude = [];
						if (Array.isArray(api.options.exclude)) {
							api.options.exclude.push(/^\0/);
						}
					}
					if (
						api?.filter?.id?.exclude &&
						Array.isArray(api.filter.id.exclude)
					) {
						api.filter.id.exclude.push(/^\0/);
					}
				}
			}
		},

		resolveId: {
			filter: { id: /\.svelte(\?.*)?$/ },
			async handler(source, importer) {
				// Pass through virtual modules, raw queries, svelte internals, or pure Svelte sub-components
				if (
					source.startsWith("\0") ||
					source.includes("?arkano-raw") ||
					source.includes("?svelte") ||
					source.includes("&svelte") ||
					(importer &&
						(importer.replace(/\?.*$/, "").endsWith(".svelte") ||
							importer.replace(/\\/g, "/").includes("/fixtures/components/")))
				) {
					return null;
				}

				// Resolve canonical filesystem path
				const resolved = this?.resolve
					? await this.resolve(source, importer, { skipSelf: true })
					: { id: source, external: false };

				if (!resolved || resolved.external) return null;

				const cleanPath = resolved.id.replace(/\?.*$/, "").replace(/\\/g, "/");
				const effectiveTarget = source.includes("target=vue")
					? "vue"
					: source.includes("target=react")
						? "react"
						: targetFramework;

				return `\0arkano:${effectiveTarget}:${cleanPath}`;
			},
		},

		load: {
			filter: { id: prefixRegex("\0arkano:") },
			handler(id) {
				const isReact = id.startsWith("\0arkano:react:");
				const isVue = id.startsWith("\0arkano:vue:");
				const sveltePath = id.replace(/^\0arkano:(react|vue):/, "");
				const rawImport = `${sveltePath}?arkano-raw`;

				if (isReact) {
					return `
import React from 'react';
import { Arkano } from '@arkano/react';
import SvelteComponent from '${rawImport}';

export default function ArkanoReactBridge(props) {
  return React.createElement(Arkano, { this: SvelteComponent, ...props });
}
export * from '${rawImport}';
`;
				}

				if (isVue) {
					return `
import { defineComponent, h } from 'vue';
import { Arkano } from '@arkano/vue';
import SvelteComponent from '${rawImport}';

export default defineComponent({
  name: 'ArkanoVueBridge',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(Arkano, { this: SvelteComponent, ...attrs }, slots);
  }
});
export * from '${rawImport}';
`;
				}

				return null;
			},
		},

		hotUpdate(options: HotUpdateOptions) {
			const { file, modules, timestamp } = options;
			if (!file.endsWith(".svelte")) return modules;

			const devEnv = this.environment as DevEnvironment | undefined;
			if (!devEnv?.moduleGraph) return modules;

			// Locate all virtual adapters referencing the modified Svelte file in this environment
			const affectedAdapters = Array.from(
				devEnv.moduleGraph.idToModuleMap.values(),
			).filter(
				(mod) => mod.id?.startsWith("\0arkano:") && mod.id.includes(file),
			);

			if (affectedAdapters.length === 0) {
				return modules;
			}

			for (const mod of affectedAdapters) {
				devEnv.moduleGraph.invalidateModule(mod);
			}

			// Scoped HMR event push via Environment API
			devEnv.hot.send({
				type: "custom",
				event: "arkano:hmr-reload",
				data: { file, timestamp },
			});

			// Return affected virtual modules to isolate update to the adapter boundary
			return affectedAdapters;
		},
	};
}
