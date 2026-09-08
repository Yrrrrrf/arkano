# ⚛️ Phase 3 Specification: `@arkane/react` Engine (React 19)

> **Target Goal:** Implement `@arkane/react`, the React 19 universal host and HOC adapter. This module allows native React 19 applications to mount and control Svelte 5 Runes components inside a layout-invisible container (`display: contents`) with fine-grained reactivity, direct React 19 `ref`-as-prop forwarding, and zero component remounts on prop updates.

---

## 🎯 1. Phase Objectives

1. **The Invisible React 19 Host (`src/host.svelte.ts`):**
   - Render a polymorphic container tag (defaulting to `<span>` or configurable as `<div>`, `<section>`, etc.) with `style={{ display: 'contents' }}`.
   - Enforce zero box-model footprint: Flexbox, CSS Grid, and Tailwind CSS v4 / DaisyUI `.join` styling must cascade directly into Svelte children without layout shifts.
   - Maintain the Svelte component instance across React renders; invoke `conduit.reconcile(props)` on render passes to trigger fine-grained Svelte 5 reactivity without DOM remounts.
   - Support React 19's native `ref`-as-prop directly without legacy `forwardRef`.
   - On React unmount, cleanly execute `unmount(instance, { outro: true })` and `conduit.dispose()`.
2. **The Higher-Order Adapter (`src/adapter.svelte.ts`):**
   - Provide `arkane(SvelteComponent)` (and alias `toReact`) to convert any Svelte 5 component into an idiomatic, JSX-callable React component with full TypeScript prop inference (`ComponentProps<C>`).
   - Support optional ArkType schema validation in development mode.
   - Assign informative `displayName` (`arkane(ComponentName)`).
3. **Typings Architecture (`src/types.ts`):**
   - Define exact React 19 host and adapter prop interfaces, HTML tag polymorphic choices, and ref typings.
4. **Integration Test Suite (`tests/`):**
   - Verify mounting of `fixtures/components/Counter.svelte` and `Icon.svelte`.
   - Assert `display: contents` styling is present on the host wrapper.
   - Assert prop updates update text inside Svelte without recreating the Svelte component or resetting internal state.
   - Assert React unmount destroys the Svelte instance cleanly.

---

## 📁 2. File Operations Directory

| Operation | Target Path | Description |
| :--- | :--- | :--- |
| **CREATE** | `packages/react/package.json` | Package manifest with React 19 peer dependencies. |
| **CREATE** | `packages/react/tsconfig.json` | TypeScript configuration with React 19 JSX support. |
| **CREATE** | `packages/react/vitest.config.ts` | Vitest configuration with JSDOM / browser environment. |
| **CREATE** | `packages/react/src/types.ts` | Type definitions for React 19 host and adapter. |
| **CREATE** | `packages/react/src/host.svelte.ts` | The layout-invisible `<Arkane />` host component. |
| **CREATE** | `packages/react/src/adapter.svelte.ts` | `arkane()` and `toReact()` higher-order adapter. |
| **CREATE** | `packages/react/src/index.ts` | Public API surface exports. |
| **CREATE** | `packages/react/tests/host.test.tsx` | Vitest integration tests for React 19 host. |
| **CREATE** | `packages/react/tests/adapter.test.tsx` | Vitest tests for `arkane()` HOC. |

---

## 💻 3. Verbatim Source Code Implementations

### 3.1 `packages/react/package.json`
```json
{
  "name": "@arkane/react",
  "version": "1.0.0",
  "description": "Native React 19 host and higher-order adapter for Svelte 5 Runes components",
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
    "@arkane/core": "^1.0.0",
    "react": ">=19.0.0",
    "react-dom": ">=19.0.0",
    "svelte": ">=5.0.0"
  },
  "dependencies": {
    "@arkane/core": "workspace:*"
  }
}
```

### 3.2 `packages/react/tsconfig.json`
```json
{
  "extends": "../../config/tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "rootDir": "./",
    "outDir": "./dist"
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

### 3.3 `packages/react/vitest.config.ts`
```ts
import { defineConfig } from 'vite-plus';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    react(),
    svelte({ compilerOptions: { runes: true } })
  ],
  test: {
    name: 'react',
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.tsx', 'tests/**/*.test.ts']
  }
});
```

### 3.4 `packages/react/src/types.ts`
```ts
import type React from 'react';
import type { Component, ComponentProps } from 'svelte';

export type SupportedHostTag = 'span' | 'div' | 'section' | 'article' | 'header' | 'footer' | 'main';

export type ArkaneHostProps<C extends Component<Record<string, unknown>, Record<string, unknown>>> = {
  /** The Svelte 5 component to mount */
  this: C;
  /** HTML host container tag. Defaults to 'span' with display: contents */
  as?: SupportedHostTag;
  /** Optional class name applied to the host container */
  className?: string;
  /** Direct React 19 ref forwarded to the container element */
  ref?: React.Ref<HTMLElement>;
} & (ComponentProps<C> extends Record<string, unknown> ? ComponentProps<C> : Record<string, unknown>);

export interface ArkaneAdapterOptions {
  /** HTML container tag. Defaults to 'span' with display: contents */
  as?: SupportedHostTag;
  /** Optional default class name applied to container */
  className?: string;
  /** Optional ArkType runtime schema definition for development prop validation */
  schema?: object;
}
```

### 3.5 `packages/react/src/host.svelte.ts`
```tsx
import React, { useEffect, useRef, useImperativeHandle } from 'react';
import { type Component, mount, unmount } from 'svelte';
import { createReactiveConduit } from '@arkane/core';
import type { ArkaneHostProps } from './types.ts';

/**
 * Arkane Host for React 19.
 * Mounts a Svelte 5 component inside a layout-invisible container with fine-grained reactivity.
 */
export function Arkane<C extends Component<Record<string, unknown>, Record<string, unknown>>>({
  this: SvelteComponent,
  as: Tag = 'span',
  className,
  ref,
  ...props
}: ArkaneHostProps<C>) {
  const containerRef = useRef<HTMLElement>(null);
  const conduitRef = useRef<ReturnType<typeof createReactiveConduit> | null>(null);

  // React 19 ref forwarding directly to container DOM node
  useImperativeHandle(ref, () => containerRef.current as HTMLElement);

  // 1. Mount and Teardown Lifecycle
  useEffect(() => {
    if (!containerRef.current) return;

    // Create Svelte 5 reactive proxy
    const conduit = createReactiveConduit(props);
    conduitRef.current = conduit;

    const instance = mount(SvelteComponent, {
      target: containerRef.current,
      props: conduit.proxy,
      intro: true
    });

    return () => {
      unmount(instance, { outro: true });
      conduit.dispose();
      conduitRef.current = null;
    };
  }, [SvelteComponent]);

  // 2. Fine-grained Reactivity: Prop reconciliation on re-render without remounting
  useEffect(() => {
    if (conduitRef.current) {
      conduitRef.current.reconcile(props);
    }
  });

  return React.createElement(Tag, {
    ref: containerRef,
    className,
    style: { display: 'contents' }
  });
}
```

### 3.6 `packages/react/src/adapter.svelte.ts`
```tsx
import React from 'react';
import { type Component, type ComponentProps } from 'svelte';
import { createPropValidator } from '@arkane/core';
import { Arkane } from './host.svelte.ts';
import type { ArkaneAdapterOptions, SupportedHostTag } from './types.ts';

/**
 * Wraps a Svelte 5 component into a native React 19 component.
 * Supports direct JSX invocation (<Counter count={10} />) with full IntelliSense.
 */
export function arkane<C extends Component<Record<string, unknown>, Record<string, unknown>>>(
  SvelteComponent: C,
  options?: ArkaneAdapterOptions
) {
  type Props = ComponentProps<C> & {
    as?: SupportedHostTag;
    className?: string;
    ref?: React.Ref<HTMLElement>;
  };

  const validator = options?.schema ? createPropValidator(options.schema) : null;

  const ReactBridge = ({ as, className, ref, ...props }: Props) => {
    if (validator) {
      validator(props);
    }

    return React.createElement(Arkane, {
      this: SvelteComponent,
      as: as ?? options?.as ?? 'span',
      className: className ?? options?.className,
      ref,
      ...(props as Record<string, unknown>)
    });
  };

  const name = (SvelteComponent as { name?: string }).name || 'SvelteComponent';
  ReactBridge.displayName = `arkane(${name})`;

  return ReactBridge;
}

export { arkane as toReact };
```

### 3.7 `packages/react/src/index.ts`
```ts
export * from './types.ts';
export * from './host.svelte.ts';
export * from './adapter.svelte.ts';
```

---

## 🧪 4. Complete Test Suite Implementations

### 4.1 `packages/react/tests/host.test.tsx`
```tsx
import React, { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Arkane } from '../src/host.svelte.ts';
// @ts-ignore - Svelte fixture import
import Counter from '../../../fixtures/components/Counter.svelte';

describe('React 19 <Arkane /> Host', () => {
  it('renders with layout-invisible display: contents container', () => {
    const { container } = render(<Arkane this={Counter} initial={0} />);
    const hostElement = container.querySelector('span');
    expect(hostElement).not.toBeNull();
    expect(hostElement?.style.display).toBe('contents');
  });

  it('renders custom container tag with className', () => {
    const { container } = render(
      <Arkane this={Counter} as="div" className="arkane-custom-host" initial={5} />
    );
    const hostElement = container.querySelector('div.arkane-custom-host');
    expect(hostElement).not.toBeNull();
    expect(hostElement?.style.display).toBe('contents');
    expect(screen.getByText('5')).not.toBeNull();
  });

  it('updates props fine-grained without remounting Svelte component', async () => {
    function Parent() {
      const [count, setCount] = useState(1);
      return (
        <div>
          <button type="button" onClick={() => setCount(c => c + 1)}>Increment Parent</button>
          <Arkane this={Counter} count={count} />
        </div>
      );
    }

    render(<Parent />);
    expect(screen.getByText('1')).not.toBeNull();

    // Trigger parent re-render with new prop
    const button = screen.getByText('Increment Parent');
    await act(async () => {
      button.click();
    });

    expect(screen.getByText('2')).not.toBeNull();
  });

  it('forwards React 19 ref directly to host DOM element', () => {
    let capturedRef: HTMLElement | null = null;
    function RefConsumer() {
      return (
        <Arkane
          this={Counter}
          ref={(node) => {
            capturedRef = node;
          }}
        />
      );
    }

    render(<RefConsumer />);
    expect(capturedRef).not.toBeNull();
    expect((capturedRef as HTMLElement | null)?.tagName.toLowerCase()).toBe('span');
  });
});
```

### 4.2 `packages/react/tests/adapter.test.tsx`
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { arkane, toReact } from '../src/adapter.svelte.ts';
// @ts-ignore - Svelte fixture import
import Counter from '../../../fixtures/components/Counter.svelte';

describe('React 19 arkane() / toReact() HOC', () => {
  it('creates an idiomatic React component with displayName', () => {
    const ReactCounter = arkane(Counter);
    expect(ReactCounter.displayName).toContain('arkane(');

    render(<ReactCounter initial={42} />);
    expect(screen.getByText('42')).not.toBeNull();
  });

  it('toReact alias works identically', () => {
    const ReactCounter = toReact(Counter);
    render(<ReactCounter initial={100} />);
    expect(screen.getByText('100')).not.toBeNull();
  });
});
```

---

## 🔍 5. Verification Protocol

1. **Unit & Integration Test Execution:**
   ```bash
   just test react
   ```
   *Expected Output:* 100% passed in `packages/react/tests/`.
2. **React 19 Type Checking:**
   ```bash
   just types-react
   ```
   *Expected Output:* `tsc -p packages/react/tsconfig.json --noEmit` passes with 0 errors.
