import {
	type MountedConduit,
	mountSvelteConduit,
} from "../../core/src/index.ts";
import React, { useEffect, useImperativeHandle, useRef } from "react";
import type { Component } from "svelte";
import type { ArkanoHostProps } from "./types.ts";

/**
 * Arkano Host for React 19.
 * Mounts a Svelte 5 component inside a layout-invisible container with fine-grained reactivity.
 */
export function Arkano<
	C extends Component<Record<string, unknown>, Record<string, unknown>>,
>({
	this: SvelteComponent,
	as: Tag = "span",
	className,
	ref,
	...props
}: ArkanoHostProps<C>): React.ReactElement {
	const containerRef = useRef<HTMLElement>(null);
	const bridgeRef = useRef<MountedConduit | null>(null);
	const propsRef = useRef(props);
	propsRef.current = props;

	// React 19 ref forwarding directly to container DOM node
	useImperativeHandle(ref, () => containerRef.current as HTMLElement);

	// 1. Mount and Teardown Lifecycle
	useEffect(() => {
		if (!containerRef.current) return;

		const bridge = mountSvelteConduit(
			SvelteComponent,
			containerRef.current,
			props as Record<string, unknown>,
			{
				onBindableChange(key: string, value: unknown) {
					const currentProps = propsRef.current as Record<string, unknown>;
					const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
					const specificHandler = currentProps[`on${capitalizedKey}Change`];
					if (typeof specificHandler === "function") {
						(specificHandler as (val: unknown) => void)(value);
					}
					const lowerHandler = currentProps[`on${key}change`];
					if (typeof lowerHandler === "function") {
						(lowerHandler as (val: unknown) => void)(value);
					}
					if (key === "value" || key === "modelValue") {
						const generalChange = currentProps.onChange;
						if (typeof generalChange === "function") {
							(generalChange as (val: unknown) => void)(value);
						}
					}
				},
			},
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

export { Arkano as Svelte };
