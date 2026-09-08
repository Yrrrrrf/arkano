# ⚡ Phase 2 Specification: `@arkane/core` Engine & Reactive Conduit

> **Target Goal:** Implement the foundational runtime engine of Arkane in `packages/core`. This package establishes the Svelte 5 `$state` fine-grained reactive proxy conduit, cross-framework event casing normalizer, synthetic snippet translation bridge, and development-mode ArkType schema guard.

---

## 🎯 1. Phase Objectives

1. **Fine-Grained Reactive Proxy (`src/proxy.svelte.ts`):**
   - Wrap incoming foreign properties into a persistent Svelte 5 `$state` proxy.
   - Implement `reconcile()` to mutate existing keys in-place and remove omitted keys without breaking proxy identity or triggering full component remounts.
   - Implement `dispose()` to detach reactive dependencies and clean memory.
2. **Event Normalization Engine (`src/events.ts`):**
   - Translate React-style camelCase event properties (`onClick`, `onKeyDown`, `onChange`, `onInput`) to standard HTML / Svelte 5 lowercase callback props (`onclick`, `onkeydown`, etc.).
   - Support arbitrary custom callbacks (e.g. `onSelect` ➔ `onselect`).
   - Preserve both camelCase and lowercase keys for maximum compatibility.
3. **Synthetic Snippets Bridge (`src/snippets.ts`):**
   - Provide `createSyntheticSnippet()` to bridge React children and Vue render functions into Svelte 5 `Snippet` interfaces.
4. **ArkType Development Validation Guard (`src/validation.ts`):**
   - Provide sub-millisecond prop contract validation in development mode using ArkType.
   - Ensure the validator is completely bypassed with zero runtime overhead when `NODE_ENV === 'production'`.
5. **Exhaustive Test Suite (`tests/`):**
   - Unit test proxy state updates, additions, deletions, idempotency, and disposal.
   - Unit test event normalization dictionary and dynamic fallbacks.
   - Unit test ArkType prop validation error formatting.

---

## 📁 2. File Operations Directory

| Operation | Target Path | Description |
| :--- | :--- | :--- |
| **CREATE** | `packages/core/package.json` | Package manifest with exports. |
| **CREATE** | `packages/core/tsconfig.json` | TypeScript configuration for core. |
| **CREATE** | `packages/core/vitest.config.ts` | Vitest configuration for core tests. |
| **CREATE** | `packages/core/src/proxy.svelte.ts` | The fine-grained `$state` proxy conduit. |
| **CREATE** | `packages/core/src/events.ts` | Event casing normalizer. |
| **CREATE** | `packages/core/src/snippets.ts` | Snippet interop adapter. |
| **CREATE** | `packages/core/src/validation.ts` | ArkType development validator. |
| **CREATE** | `packages/core/src/index.ts` | Public API surface exports. |
| **CREATE** | `packages/core/tests/proxy.test.ts` | Unit tests for reactive conduit. |
| **CREATE** | `packages/core/tests/events.test.ts` | Unit tests for event normalizer. |
| **CREATE** | `packages/core/tests/validation.test.ts` | Unit tests for ArkType validator. |

---

## 💻 3. Verbatim Source Code Implementations

### 3.1 `packages/core/package.json`
```json
{
  "name": "@arkane/core",
  "version": "1.0.0",
  "description": "Core reactive conduit, proxy synchronization, and event normalization for Arkane",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  },
  "peerDependencies": {
    "svelte": ">=5.0.0"
  },
  "dependencies": {
    "arktype": ">=2.0.0"
  }
}
```

### 3.2 `packages/core/tsconfig.json`
```json
{
  "extends": "../../config/tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "./",
    "outDir": "./dist"
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

### 3.3 `packages/core/vitest.config.ts`
```ts
import { defineConfig } from 'vite-plus';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { runes: true } })],
  test: {
    name: 'core',
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
```

### 3.4 `packages/core/src/events.ts`
```ts
/**
 * Lookup table mapping React camelCase event handler prop names to standard
 * Svelte 5 / DOM lowercase callback attribute names.
 */
const EVENT_MAP: Record<string, string> = {
  onClick: 'onclick',
  onDoubleClick: 'ondblclick',
  onChange: 'onchange',
  onInput: 'oninput',
  onKeyDown: 'onkeydown',
  onKeyUp: 'onkeyup',
  onKeyPress: 'onkeypress',
  onMouseDown: 'onmousedown',
  onMouseUp: 'onmouseup',
  onMouseEnter: 'onmouseenter',
  onMouseLeave: 'onmouseleave',
  onMouseMove: 'onmousemove',
  onMouseOver: 'onmouseover',
  onMouseOut: 'onmouseout',
  onFocus: 'onfocus',
  onBlur: 'onblur',
  onSubmit: 'onsubmit',
  onReset: 'onreset',
  onScroll: 'onscroll',
  onWheel: 'onwheel',
  onTouchStart: 'ontouchstart',
  onTouchMove: 'ontouchmove',
  onTouchEnd: 'ontouchend',
  onTouchCancel: 'ontouchcancel',
  onPointerDown: 'onpointerdown',
  onPointerUp: 'onpointerup',
  onPointerMove: 'onpointermove',
  onPointerEnter: 'onpointerenter',
  onPointerLeave: 'onpointerleave',
  onPointerCancel: 'onpointercancel'
};

/**
 * Normalizes foreign event casing to Svelte 5 compatible lowercase attribute keys.
 * Handles both known DOM events and dynamic camelCase event props (e.g. `onSelect` -> `onselect`).
 */
export function normalizeEventName(reactEventName: string): string {
  if (EVENT_MAP[reactEventName]) {
    return EVENT_MAP[reactEventName];
  }
  if (
    reactEventName.startsWith('on') &&
    reactEventName.length > 2 &&
    reactEventName[2] === reactEventName[2].toUpperCase()
  ) {
    return 'on' + reactEventName.slice(2).toLowerCase();
  }
  return reactEventName;
}
```

### 3.5 `packages/core/src/proxy.svelte.ts`
```ts
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
  options: ConduitOptions = {}
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
    }
  };
}

/**
 * Sanitizes incoming framework props by stripping internal framework keys
 * and normalizing event handler names.
 */
export function sanitizeProps(
  rawProps: Record<string, unknown>,
  normalizeEvents = true
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
```

### 3.6 `packages/core/src/snippets.ts`
```ts
import type { Snippet } from 'svelte';

/**
 * Bridges foreign framework render callbacks into Svelte 5 Snippets.
 * When Svelte invokes the snippet, `renderToTarget` mounts foreign DOM into the target element.
 */
export function createSyntheticSnippet<T extends unknown[] = []>(
  renderToTarget: (target: HTMLElement, ...args: T) => () => void
): Snippet<T> {
  return ((target: HTMLElement, ...args: T) => {
    const teardown = renderToTarget(target, ...args);
    return {
      destroy() {
        teardown?.();
      }
    };
  }) as unknown as Snippet<T>;
}
```

### 3.7 `packages/core/src/validation.ts`
```ts
import { type } from 'arktype';

/**
 * Creates a sub-millisecond prop contract validator using ArkType.
 * Stripped to a no-op when NODE_ENV === 'production'.
 */
export function createPropValidator<T extends Record<string, unknown>>(
  schemaDefinition: object
): (props: unknown) => boolean {
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'production'
  ) {
    return (_props: unknown) => true;
  }

  const validator = type(schemaDefinition);

  return (props: unknown) => {
    const out = validator(props);
    if (out instanceof type.errors) {
      console.warn(
        `[Arkane Prop Mismatch] Component received invalid props:\n${out.summary}`
      );
      return false;
    }
    return true;
  };
}
```

### 3.8 `packages/core/src/index.ts`
```ts
export * from './proxy.svelte.ts';
export * from './events.ts';
export * from './snippets.ts';
export * from './validation.ts';
```

---

## 🧪 4. Complete Test Suite Implementations

### 4.1 `packages/core/tests/events.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { normalizeEventName } from '../src/events.ts';
import { sanitizeProps } from '../src/proxy.svelte.ts';

describe('Event Normalizer', () => {
  it('maps known React camelCase events to Svelte lowercase equivalents', () => {
    expect(normalizeEventName('onClick')).toBe('onclick');
    expect(normalizeEventName('onChange')).toBe('onchange');
    expect(normalizeEventName('onInput')).toBe('oninput');
    expect(normalizeEventName('onKeyDown')).toBe('onkeydown');
    expect(normalizeEventName('onMouseEnter')).toBe('onmouseenter');
    expect(normalizeEventName('onSubmit')).toBe('onsubmit');
  });

  it('normalizes custom camelCase callback props', () => {
    expect(normalizeEventName('onSelect')).toBe('onselect');
    expect(normalizeEventName('onCustomFilter')).toBe('oncustomfilter');
    expect(normalizeEventName('onValueChange')).toBe('onvaluechange');
  });

  it('preserves non-event prop names intact', () => {
    expect(normalizeEventName('className')).toBe('className');
    expect(normalizeEventName('count')).toBe('count');
    expect(normalizeEventName('only')).toBe('only');
  });

  it('sanitizes and injects both casing keys into props dictionary', () => {
    const fn = () => {};
    const sanitized = sanitizeProps({ onClick: fn, count: 10, children: 'ignore' });
    expect(sanitized.onClick).toBe(fn);
    expect(sanitized.onclick).toBe(fn);
    expect(sanitized.count).toBe(10);
    expect('children' in sanitized).toBe(false);
  });
});
```

### 4.2 `packages/core/tests/proxy.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { createReactiveConduit } from '../src/proxy.svelte.ts';

describe('Reactive Conduit Engine', () => {
  it('creates a proxy with initial properties', () => {
    const conduit = createReactiveConduit({ count: 1, label: 'test' });
    expect(conduit.proxy.count).toBe(1);
    expect(conduit.proxy.label).toBe('test');
  });

  it('mutates existing properties in-place without altering proxy identity', () => {
    const conduit = createReactiveConduit({ count: 1 });
    const initialProxyRef = conduit.proxy;

    conduit.reconcile({ count: 2 });
    expect(conduit.proxy.count).toBe(2);
    expect(conduit.proxy).toBe(initialProxyRef); // Identity preserved!
  });

  it('dynamically inserts newly added properties', () => {
    const conduit = createReactiveConduit<{ count: number; next?: string }>({ count: 1 });
    conduit.reconcile({ count: 1, next: 'added' });
    expect(conduit.proxy.count).toBe(1);
    expect(conduit.proxy.next).toBe('added');
  });

  it('cleanly deletes omitted properties from the proxy', () => {
    const conduit = createReactiveConduit<Record<string, unknown>>({ a: 1, b: 2 });
    expect(conduit.proxy.a).toBe(1);
    expect(conduit.proxy.b).toBe(2);

    conduit.reconcile({ a: 1 });
    expect(conduit.proxy.a).toBe(1);
    expect('b' in conduit.proxy).toBe(false);
  });

  it('disposes all properties when conduit is terminated', () => {
    const conduit = createReactiveConduit({ count: 1, title: 'hello' });
    conduit.dispose();
    expect(Object.keys(conduit.proxy).length).toBe(0);
  });
});
```

### 4.3 `packages/core/tests/validation.test.ts`
```ts
import { describe, expect, it, vi } from 'vitest';
import { createPropValidator } from '../src/validation.ts';

describe('ArkType Prop Validator Guard', () => {
  it('passes valid properties against schema', () => {
    const validator = createPropValidator({
      'count?': 'number',
      'title': 'string'
    });

    const isValid = validator({ count: 42, title: 'Valid' });
    expect(isValid).toBe(true);
  });

  it('catches invalid properties and logs diagnostic warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const validator = createPropValidator({
      count: 'number'
    });

    const isValid = validator({ count: 'not-a-number' });
    expect(isValid).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
```

---

## 🔍 5. Verification Protocol

Run the following commands to verify Phase 2 completion:

1. **Unit Test Execution:**
   ```bash
   just test core
   ```
   *Expected Output:* 100% tests passing in `packages/core/tests/`.
2. **Type Check:**
   ```bash
   just types-core
   ```
   *Expected Output:* `deno check packages/core/src/index.ts` completes cleanly with 0 type errors.
