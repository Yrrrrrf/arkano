import React, { useEffect, useRef, useImperativeHandle } from "react";
import type { Component } from "svelte";
import { mountSvelteConduit, type MountedConduit } from "@arkane/core";
import type { ArkaneHostProps } from "./types.ts";

/**
 * Arkane Host for React 19.
 * Mounts a Svelte 5 component inside a layout-invisible container with fine-grained reactivity.
 */
export function Arkane<
	C extends Component<Record<string, unknown>, Record<string, unknown>>,
>({
	this: SvelteComponent,
	as: Tag = "span",
	className,
	ref,
	...props
}: ArkaneHostProps<C>) {
	const containerRef = useRef<HTMLElement>(null);
	const bridgeRef = useRef<MountedConduit | null>(null);

	// React 19 ref forwarding directly to container DOM node
	useImperativeHandle(ref, () => containerRef.current as HTMLElement);

	// 1. Mount and Teardown Lifecycle
	useEffect(() => {
		if (!containerRef.current) return;

		const bridge = mountSvelteConduit(
			SvelteComponent,
			containerRef.current,
			props as Record<string, unknown>,
		);
		bridgeRef.current = bridge;

		return () => {
			bridge.destroy();
			bridgeRef.current = null;
		};
	}, [SvelteComponent]);

	// 2. Fine-grained Reactivity: Prop reconciliation on re-render without remounting
	useEffect(() => {
		if (bridgeRef.current) {
			bridgeRef.current.reconcile(props as Record<string, unknown>);
		}
	});

	return React.createElement(Tag, {
		ref: containerRef,
		className,
		style: { display: "contents" },
	});
}

export { Arkane as Svelte };
