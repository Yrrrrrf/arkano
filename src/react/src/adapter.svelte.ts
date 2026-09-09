import { createPropValidator } from "@arkane/core";
import React from "react";
import type { Component, ComponentProps } from "svelte";
import { Arkane } from "./host.svelte.ts";
import type { ArkaneAdapterOptions, SupportedHostTag } from "./types.ts";

export type ArkaneReactComponent<
	C extends Component<Record<string, unknown>, Record<string, unknown>>,
> = {
	(
		props: ComponentProps<C> & {
			as?: SupportedHostTag;
			className?: string;
			ref?: React.Ref<HTMLElement>;
		},
	): React.ReactElement;
	displayName?: string;
};

/**
 * Wraps a Svelte 5 component into a native React 19 component.
 * Supports direct JSX invocation (<Counter count={10} />) with full IntelliSense.
 */
export function arkane<
	C extends Component<Record<string, unknown>, Record<string, unknown>>,
>(SvelteComponent: C, options?: ArkaneAdapterOptions): ArkaneReactComponent<C> {
	type Props = ComponentProps<C> & {
		as?: SupportedHostTag;
		className?: string;
		ref?: React.Ref<HTMLElement>;
	};

	const validator = options?.schema
		? createPropValidator(options.schema)
		: null;

	const ReactBridge = ({ as, className, ref, ...props }: Props) => {
		if (validator) {
			validator(props);
		}

		return React.createElement(Arkane, {
			this: SvelteComponent,
			as: as ?? options?.as ?? "span",
			className: className ?? options?.className,
			ref,
			...(props as Record<string, unknown>),
		});
	};

	const name = (SvelteComponent as { name?: string }).name || "SvelteComponent";
	ReactBridge.displayName = `arkane(${name})`;

	return ReactBridge;
}
