import type { Snippet } from "svelte";

/**
 * Bridges foreign framework render callbacks into Svelte 5 Snippets.
 * When Svelte invokes the snippet, `renderToTarget` mounts foreign DOM into the target element.
 */
export function createSyntheticSnippet<T extends unknown[] = []>(
	renderToTarget: (target: HTMLElement, ...args: T) => () => void,
): Snippet<T> {
	return ((target: HTMLElement, ...args: T) => {
		const teardown = renderToTarget(target, ...args);
		return {
			destroy() {
				teardown?.();
			},
		};
	}) as unknown as Snippet<T>;
}
