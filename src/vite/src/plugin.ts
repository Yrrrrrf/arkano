import type { Plugin, ResolvedConfig } from "vite";

export interface ArkanePluginOptions {
	/** Target framework to adapt to. Defaults to 'react' */
	target?: "react" | "vue";
	/** Glob pattern for auto-wrapping Svelte components without query params */
	include?: string | RegExp | Array<string | RegExp>;
}

/**
 * Arkane Vite & Rolldown transform plugin.
 * Resolves virtual imports like `import Counter from './Counter.svelte?arkane'`
 * and returns on-the-fly wrapped React 19 or Vue 3.5 component modules.
 */
export function arkane(options: ArkanePluginOptions = {}): Plugin {
	const defaultTarget = options.target ?? "react";
	let _config: ResolvedConfig | undefined;

	return {
		name: "vite-plugin-arkane",
		enforce: "post", // Executes after @sveltejs/vite-plugin-svelte

		configResolved(resolvedConfig) {
			_config = resolvedConfig;
		},

		resolveId(id) {
			if (id.includes("?arkane")) {
				return id;
			}
			return null;
		},

		async transform(_code, id) {
			if (!id.includes("?arkane")) return null;

			const isReactTarget =
				id.includes("target=react") ||
				(!id.includes("target=vue") && defaultTarget === "react");
			const isVueTarget =
				id.includes("target=vue") ||
				(!id.includes("target=react") && defaultTarget === "vue");

			// Strip query string to retrieve canonical filesystem path
			const cleanPath = id.replace(/\?arkane.*$/, "");

			if (isReactTarget) {
				return {
					code: `
            import { arkane } from '@arkane/react';
            import SvelteComponent from '${cleanPath}';
            export default arkane(SvelteComponent);
            export * from '${cleanPath}';
          `,
					map: null,
				};
			}

			if (isVueTarget) {
				return {
					code: `
            import { arkane } from '@arkane/vue';
            import SvelteComponent from '${cleanPath}';
            export default arkane(SvelteComponent);
            export * from '${cleanPath}';
          `,
					map: null,
				};
			}

			return null;
		},
	};
}
