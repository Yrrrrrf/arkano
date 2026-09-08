import { normalizeEventName } from './events.ts';

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

  // Instantiates Svelte 5 fine-grained reactive proxy
  const proxy = $state({ ...sanitized }) as P;

  return {
    get proxy() {
      return proxy;
    },
    reconcile(incomingProps: Record<string, unknown>) {
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
    // Exclude framework-internal metadata
    if (key === 'children' || key === 'key' || key === 'ref') continue;

    // Normalize React camelCase event names
    if (
      normalizeEvents &&
      key.startsWith('on') &&
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

  return result;
}
