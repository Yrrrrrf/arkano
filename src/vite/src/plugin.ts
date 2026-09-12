import { createFilter, normalizePath } from "vite-plus";
import type { DevEnvironment, HotUpdateOptions, Plugin } from "vite-plus";

export interface ArkanoPluginOptions {
	/** Host framework. Auto detects Vue and otherwise selects React. */
	target?: "react" | "vue" | "auto";
	/** Resolved component paths to bridge. Defaults to local .svelte files. */
	include?: string | RegExp | Array<string | RegExp>;
	/** Paths to keep as native Svelte components. Defaults to node_modules. */
	exclude?: string | RegExp | Array<string | RegExp>;
}

const BRIDGE_PREFIX = "\0arkano:";
const bridgeId = /^\0arkano:(react|vue):/;

export function createArkanoCorePlugin(
	options: ArkanoPluginOptions = {},
): Plugin {
	let targetFramework: "react" | "vue" =
		options.target === "vue" ? "vue" : "react";
	let shouldBridge = createFilter(
		options.include,
		options.exclude ?? /\/node_modules\//,
	);

	return {
		name: "vite-plugin-arkano",
		enforce: "pre",
		configResolved(config) {
			shouldBridge = createFilter(
				options.include,
				options.exclude ?? /\/node_modules\//,
				{ resolve: config.root },
			);
			if (!options.target || options.target === "auto") {
				targetFramework = config.plugins.some(
					(plugin) =>
						plugin.name === "vite:vue" || plugin.name === "@vitejs/plugin-vue",
				)
					? "vue"
					: "react";
			}
		},
		resolveId: {
			filter: { id: /\.svelte(?:\?.*)?$/ },
			async handler(source, importer) {
				if (source.startsWith("\0")) return null;
				const [filename, search = ""] = source.split("?", 2);
				const query = new URLSearchParams(search);

				// Explicit raw-component imports still compile as Svelte, using its
				// canonical module ID so virtual CSS can find compilation metadata.
				if (query.has("arkano-raw")) {
					query.delete("arkano-raw");
					const rest = query.toString();
					const canonical = filename + (rest ? `?${rest}` : "");
					return this.resolve(canonical, importer, { skipSelf: true });
				}

				// Never consume another plugin's query protocol, including ?raw/?url.
				if ([...query.keys()].some((key) => key !== "target")) return null;
				const targetOption = query.get("target");
				if (targetOption && !["react", "vue"].includes(targetOption)) {
					return null;
				}
				if (
					importer?.startsWith(BRIDGE_PREFIX) ||
					importer?.split("?", 1)[0].endsWith(".svelte")
				) {
					return null;
				}

				const resolved = await this.resolve(filename, importer, {
					skipSelf: true,
				});
				if (!resolved || resolved.external || resolved.id.startsWith("\0")) {
					return null;
				}
				const cleanPath = normalizePath(resolved.id);
				if (!cleanPath.endsWith(".svelte") || !shouldBridge(cleanPath)) {
					return null;
				}
				const target = query.get("target") ?? targetFramework;
				return `${BRIDGE_PREFIX}${target}:${cleanPath}`;
			},
		},
		load: {
			filter: { id: bridgeId },
			handler(id) {
				if (!bridgeId.test(id)) return null;
				const componentImport = JSON.stringify(id.replace(bridgeId, ""));
				if (id.startsWith(`${BRIDGE_PREFIX}react:`)) {
					return `
import React from 'react';
import { Arkano } from 'arkano/react';
import SvelteComponent from ${componentImport};

export default function ArkanoReactBridge(props) {
  return React.createElement(Arkano, { ...props, this: SvelteComponent });
}
export * from ${componentImport};
`;
				}
				return `
import { defineComponent, h } from 'vue';
import { Arkano } from 'arkano/vue';
import SvelteComponent from ${componentImport};

export default defineComponent({
  name: 'ArkanoVueBridge',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(Arkano, { ...attrs, this: SvelteComponent }, slots);
  }
});
export * from ${componentImport};
`;
			},
		},
		hotUpdate({ file, modules, timestamp }: HotUpdateOptions) {
			if (!file.endsWith(".svelte")) return;
			const environment = this.environment as DevEnvironment;
			const path = normalizePath(file);
			const adapters = [
				...environment.moduleGraph.idToModuleMap.values(),
			].filter(
				(mod) =>
					mod.id?.startsWith(BRIDGE_PREFIX) &&
					mod.id.replace(bridgeId, "") === path,
			);
			if (!adapters.length) return;
			const invalidated = new Set<(typeof adapters)[number]>();
			for (const mod of adapters) {
				environment.moduleGraph.invalidateModule(
					mod,
					invalidated,
					timestamp,
					true,
				);
			}
			// Retain native Svelte and CSS updates alongside affected host bridges.
			return [...new Set([...modules, ...adapters])];
		},
	};
}
