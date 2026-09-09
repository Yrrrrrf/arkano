import type { HmrContext } from "vite";

/**
 * Propagates Svelte component file updates to foreign framework modules.
 */
export function handleArkaneHmr(ctx: HmrContext) {
	if (ctx.file.endsWith(".svelte")) {
		// Invalidate virtual modules dependent on this svelte file
		const affected = Array.from(
			ctx.server.moduleGraph.idToModuleMap.values(),
		).filter((mod) => mod.id?.includes(ctx.file) && mod.id.includes("?arkane"));

		for (const mod of affected) {
			ctx.server.moduleGraph.invalidateModule(mod);
		}
	}
}
