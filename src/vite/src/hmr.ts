import type { DevEnvironment, HmrContext, HotUpdateOptions } from "vite";

/**
 * @deprecated Use the Vite 8 `hotUpdate` hook in the `arkane()` plugin instead.
 * Propagates Svelte component file updates to foreign framework modules.
 */
export function handleArkaneHmr(
	ctx: HmrContext | HotUpdateOptions,
	environment?: DevEnvironment,
) {
	const file = "file" in ctx ? ctx.file : "";
	if (!file?.endsWith(".svelte")) return;

	if (environment?.moduleGraph) {
		const affected = Array.from(
			environment.moduleGraph.idToModuleMap.values(),
		).filter((mod) => mod.id?.startsWith("\0arkane:") && mod.id.includes(file));
		for (const mod of affected) {
			environment.moduleGraph.invalidateModule(mod);
		}
	} else if ("server" in ctx && ctx.server?.moduleGraph) {
		const affected = Array.from(
			ctx.server.moduleGraph.idToModuleMap.values(),
		).filter(
			(mod) =>
				(mod.id?.startsWith("\0arkane:") || mod.id?.includes("?arkane")) &&
				mod.id.includes(file),
		);
		for (const mod of affected) {
			ctx.server.moduleGraph.invalidateModule(mod);
		}
	}
}
