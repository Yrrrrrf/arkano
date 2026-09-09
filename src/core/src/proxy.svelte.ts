import { mount, unmount } from "svelte";
import { normalizeEventName } from "./events.ts";

export interface MountedConduit {
	readonly conduit: ReactiveConduit<Record<string, unknown>>;
	readonly instance: Record<string, unknown>;
	reconcile: (incomingProps: Record<string, unknown>) => void;
	destroy: () => void;
}

export interface ReactiveConduit<P extends Record<string, unknown>> {
	/** The fine-grained reactive Svelte 5 proxy */
	readonly proxy: P;
	/** Reconciles incoming foreign properties into the proxy without breaking object identity */
	reconcile: (incomingProps: Record<string, unknown>) => void;
	/** Disposes proxy properties to clean references and prevent memory leaks */
	dispose: () => void;
}

export interface ConduitOptions {
	/** Whether to normalize React-style camelCase event handlers to lowercase. Default: true */
	normalizeEvents?: boolean;
	/** Optional callback fired when bindable properties are updated */
	onBindableChange?: (key: string, value: unknown) => void;
}

/**
 * Creates a persistent Svelte 5 $state proxy that reconciles incoming framework props.
 * Mutating individual properties on this proxy triggers Svelte 5's internal dependency graph.
 */
export function createReactiveConduit<P extends Record<string, unknown>>(
	initialProps: P,
	options: ConduitOptions = {},
): ReactiveConduit<P> {
	const normalizeEvents = options.normalizeEvents ?? true;
	const sanitized = sanitizeProps(initialProps, normalizeEvents);

	let isReconciling = false;

	// Instantiates Svelte 5 fine-grained reactive proxy
	const stateObj = $state({ ...sanitized }) as Record<string, unknown>;

	const proxy = new Proxy(stateObj, {
		set(target, prop, value) {
			const oldVal = target[prop as string];
			target[prop as string] = value;
			if (
				!isReconciling &&
				typeof prop === "string" &&
				!Object.is(oldVal, value)
			) {
				options.onBindableChange?.(prop, value);
			}
			return true;
		},
		deleteProperty(target, prop) {
			return Reflect.deleteProperty(target, prop);
		},
	}) as P;

	return {
		get proxy() {
			return proxy;
		},
		reconcile(incomingProps: Record<string, unknown>) {
			isReconciling = true;
			try {
				const nextSanitized = sanitizeProps(incomingProps, normalizeEvents);

				// 1. In-place update for existing keys and insertion of new keys
				for (const [key, value] of Object.entries(nextSanitized)) {
					if (!Object.is((proxy as Record<string, unknown>)[key], value)) {
						(proxy as Record<string, unknown>)[key] = value;
					}
				}

				// 2. Removal of keys no longer present in incoming props
				for (const key of Object.keys(proxy)) {
					if (!(key in nextSanitized)) {
						delete (proxy as Record<string, unknown>)[key];
					}
				}
			} finally {
				isReconciling = false;
			}
		},
		dispose() {
			for (const key of Object.keys(proxy)) {
				delete (proxy as Record<string, unknown>)[key];
			}
		},
	};
}

/**
 * Sanitizes incoming framework props by stripping internal framework keys
 * and normalizing event handler names.
 */
export function sanitizeProps(
	rawProps: Record<string, unknown>,
	normalizeEvents = true,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(rawProps)) {
		// Exclude framework-internal metadata (key, ref), but allow snippet children functions
		if (key === "key" || key === "ref") continue;
		if (key === "children" && typeof value !== "function") continue;

		// Normalize React camelCase event names
		if (
			normalizeEvents &&
			key.startsWith("on") &&
			key.length > 2 &&
			key[2] === key[2].toUpperCase()
		) {
			const svelteEvent = normalizeEventName(key);
			result[svelteEvent] = value;
			result[key] = value; // Preserve both for maximum backwards/forwards safety
		} else {
			result[key] = value;
		}
	}

	// Infer and initialize bound property keys from two-way binding listeners
	// React: on<Prop>Change (e.g. onCountChange -> count)
	// Vue: onUpdate:<prop> (e.g. onUpdate:count -> count)
	for (const key of Object.keys(rawProps)) {
		let boundProp: string | null = null;
		if (key.startsWith("onUpdate:")) {
			boundProp = key.slice("onUpdate:".length);
		} else if (
			key.startsWith("on") &&
			key.endsWith("Change") &&
			key.length > 8 &&
			key !== "onChange"
		) {
			const propPart = key.slice(2, -6);
			boundProp = propPart.charAt(0).toLowerCase() + propPart.slice(1);
		}

		if (boundProp && !(boundProp in result)) {
			result[boundProp] = rawProps[boundProp] ?? rawProps.initial ?? undefined;
		}
	}

	return result;
}

/**
 * High-level mounting utility that bridges external framework lifecycles to Svelte 5.
 * Returns a handle with fine-grained prop reconciliation and clean unmount.
 */
export function mountSvelteConduit(
	component: unknown,
	target: HTMLElement | null | undefined,
	initialProps: Record<string, unknown>,
	options?: ConduitOptions & { intro?: boolean; outro?: boolean },
): MountedConduit {
	const conduit = createReactiveConduit(initialProps, options);

	if (typeof document === "undefined" || !target) {
		return {
			conduit: conduit as ReactiveConduit<Record<string, unknown>>,
			instance: {},
			reconcile(incomingProps: Record<string, unknown>) {
				conduit.reconcile(incomingProps);
			},
			destroy() {
				conduit.dispose();
			},
		};
	}

	const instance = mount(component as Parameters<typeof mount>[0], {
		target,
		props: conduit.proxy,
		intro: options?.intro ?? true,
	});

	return {
		conduit: conduit as ReactiveConduit<Record<string, unknown>>,
		instance: instance as unknown as Record<string, unknown>,
		reconcile(incomingProps: Record<string, unknown>) {
			conduit.reconcile(incomingProps);
		},
		destroy() {
			unmount(instance, { outro: options?.outro ?? true });
			conduit.dispose();
		},
	};
}
