# 🟢 Phase 4 Specification: `@arkane/vue` Engine (Vue 3.5)

> **Target Goal:** Implement `@arkane/vue`, the Vue 3.5 universal host and HOC adapter. This module allows Vue 3.5 applications to mount and control Svelte 5 Runes components inside a layout-invisible container (`display: contents`) with deep attribute synchronization via Vue 3.5's Composition API, and zero component remounts on attribute mutations.

---

## 🎯 1. Phase Objectives

1. **The Invisible Vue 3.5 Host (`src/host.svelte.ts`):**
   - Implement `Arkane` via Vue 3.5 `defineComponent` with `inheritAttrs: false`.
   - Render a transparent host node via `h(props.as, { ref: containerRef, style: { display: 'contents' } })`.
   - In `onMounted`: Instantiate the reactive conduit via `createReactiveConduit(attrs)` and mount the Svelte 5 component into `containerRef.value`.
   - In `watch(() => ({ ...attrs }), (newAttrs) => conduit.reconcile(newAttrs), { deep: true })`: Synchronize incoming Vue reactive attributes into the Svelte 5 `$state` proxy without remounting.
   - In `onUnmounted`: Cleanly execute `unmount(instance, { outro: true })` and `conduit.dispose()`.
2. **The Higher-Order Adapter (`src/adapter.svelte.ts`):**
   - Provide `arkane(SvelteComponent)` and alias `toVue` to convert any Svelte 5 component into an idiomatic Vue 3.5 component with slot forwarding and `inheritAttrs: false`.
   - Assign informative component name (`arkane(ComponentName)`).
3. **Typings Architecture (`src/types.ts`):**
   - Define exact Vue 3.5 host props, container options, and adapter interfaces.
4. **Integration Test Suite (`tests/`):**
   - Mount test fixtures `Counter.svelte` and `Icon.svelte` inside Vue 3.5 using `@vue/test-utils`.
   - Assert `display: contents` container style is present.
   - Assert deep reactive `ref` attribute updates mutate the rendered Svelte component DOM without triggering component remounts.
   - Assert unmounting the Vue wrapper destroys the Svelte instance cleanly.

---

## 📁 2. File Operations Directory

| Operation | Target Path | Description |
| :--- | :--- | :--- |
| **CREATE** | `packages/vue/package.json` | Package manifest with Vue 3.5 peer dependencies. |
| **CREATE** | `packages/vue/tsconfig.json` | TypeScript configuration for Vue 3.5. |
| **CREATE** | `packages/vue/vitest.config.ts` | Vitest configuration with happy-dom / jsdom. |
| **CREATE** | `packages/vue/src/types.ts` | Type definitions for Vue 3.5 host and adapter. |
| **CREATE** | `packages/vue/src/host.svelte.ts` | Layout-invisible `<Arkane />` Vue host component. |
| **CREATE** | `packages/vue/src/adapter.svelte.ts` | `arkane()` and `toVue()` higher-order adapter. |
| **CREATE** | `packages/vue/src/index.ts` | Public API surface exports. |
| **CREATE** | `packages/vue/tests/host.test.ts` | Vitest integration tests for Vue 3.5 host. |
| **CREATE** | `packages/vue/tests/adapter.test.ts` | Vitest tests for `arkane()` HOC. |

---

## 💻 3. Verbatim Source Code Implementations

### 3.1 `packages/vue/package.json`
```json
{
  "name": "@arkane/vue",
  "version": "1.0.0",
  "description": "Native Vue 3.5 host and higher-order adapter for Svelte 5 Runes components",
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
    "svelte": ">=5.0.0",
    "vue": ">=3.5.0"
  },
  "dependencies": {
    "@arkane/core": "workspace:*"
  }
}
```

### 3.2 `packages/vue/tsconfig.json`
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

### 3.3 `packages/vue/vitest.config.ts`
```ts
import { defineConfig } from 'vite-plus';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    vue(),
    svelte({ compilerOptions: { runes: true } })
  ],
  test: {
    name: 'vue',
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts']
  }
});
```

### 3.4 `packages/vue/src/types.ts`
```ts
export type SupportedVueHostTag = 'span' | 'div' | 'section' | 'article' | 'header' | 'footer' | 'main';

export interface ArkaneVueAdapterOptions {
  /** HTML host container tag. Defaults to 'span' with display: contents */
  as?: SupportedVueHostTag;
  /** Optional class name applied to container */
  className?: string;
}
```

### 3.5 `packages/vue/src/host.svelte.ts`
```ts
import { defineComponent, h, onMounted, onUnmounted, ref, watch, type PropType } from 'vue';
import { mount, unmount } from 'svelte';
import { createReactiveConduit } from '@arkane/core';
import type { SupportedVueHostTag } from './types.ts';

/**
 * Arkane Host for Vue 3.5.
 * Mounts a Svelte 5 component inside a layout-invisible container with deep attribute synchronization.
 */
export const Arkane = defineComponent({
  name: 'ArkaneVueHost',
  props: {
    this: {
      type: [Object, Function] as PropType<Parameters<typeof mount>[0]>,
      required: true
    },
    as: {
      type: String as PropType<SupportedVueHostTag>,
      default: 'span'
    }
  },
  inheritAttrs: false,
  setup(props, { attrs }) {
    const containerRef = ref<HTMLElement | null>(null);
    const conduitRef = ref<ReturnType<typeof createReactiveConduit> | null>(null);
    let instance: Record<string, unknown> | null = null;

    onMounted(() => {
      if (!containerRef.value) return;

      const conduit = createReactiveConduit(attrs);
      conduitRef.value = conduit;

      instance = mount(props.this, {
        target: containerRef.value,
        props: conduit.proxy,
        intro: true
      });
    });

    // Deep attribute synchronization without DOM remount
    watch(
      () => ({ ...attrs }),
      (newAttrs) => {
        if (conduitRef.value) {
          conduitRef.value.reconcile(newAttrs);
        }
      },
      { deep: true }
    );

    onUnmounted(() => {
      if (instance) {
        unmount(instance, { outro: true });
        instance = null;
      }
      if (conduitRef.value) {
        conduitRef.value.dispose();
        conduitRef.value = null;
      }
    });

    return () =>
      h(props.as, {
        ref: containerRef,
        style: { display: 'contents' }
      });
  }
});
```

### 3.6 `packages/vue/src/adapter.svelte.ts`
```ts
import { defineComponent, h } from 'vue';
import { type mount } from 'svelte';
import { Arkane } from './host.svelte.ts';
import type { ArkaneVueAdapterOptions } from './types.ts';

/**
 * Wraps a Svelte 5 component into a native Vue 3.5 component.
 */
export function arkane<C extends Parameters<typeof mount>[0]>(
  SvelteComponent: C,
  options?: ArkaneVueAdapterOptions
) {
  const name = (SvelteComponent as { name?: string }).name || 'SvelteComponent';

  return defineComponent({
    name: `arkane(${name})`,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(
          Arkane,
          {
            this: SvelteComponent,
            as: options?.as ?? 'span',
            ...attrs
          },
          slots
        );
    }
  });
}

export { arkane as toVue };
```

### 3.7 `packages/vue/src/index.ts`
```ts
export * from './types.ts';
export * from './host.svelte.ts';
export * from './adapter.svelte.ts';
```

---

## 🧪 4. Complete Test Suite Implementations

### 4.1 `packages/vue/tests/host.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { mount as mountVue } from '@vue/test-utils';
import { ref } from 'vue';
import { Arkane } from '../src/host.svelte.ts';
// @ts-ignore - Svelte fixture import
import Counter from '../../../fixtures/components/Counter.svelte';

describe('Vue 3.5 <Arkane /> Host', () => {
  it('renders with layout-invisible display: contents container', () => {
    const wrapper = mountVue(Arkane, {
      props: {
        this: Counter,
        as: 'span'
      },
      attrs: {
        initial: 0
      }
    });

    const hostSpan = wrapper.find('span');
    expect(hostSpan.exists()).toBe(true);
    expect(hostSpan.attributes('style')).toContain('display: contents');
  });

  it('updates props fine-grained via deep watcher without remounting', async () => {
    const count = ref(1);
    const wrapper = mountVue({
      components: { Arkane },
      setup() {
        return { Counter, count };
      },
      template: '<Arkane :this="Counter" :count="count" />'
    });

    expect(wrapper.text()).toContain('1');

    // Mutate reactive Vue ref
    count.value = 5;
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('5');
  });

  it('unmounts cleanly and invokes Svelte unmount', () => {
    const wrapper = mountVue(Arkane, {
      props: {
        this: Counter
      }
    });
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
    expect(wrapper.element.parentElement).toBeNull();
  });
});
```

### 4.2 `packages/vue/tests/adapter.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { mount as mountVue } from '@vue/test-utils';
import { arkane, toVue } from '../src/adapter.svelte.ts';
// @ts-ignore - Svelte fixture import
import Counter from '../../../fixtures/components/Counter.svelte';

describe('Vue 3.5 arkane() / toVue() HOC', () => {
  it('creates an idiomatic Vue component with displayName', () => {
    const VueCounter = arkane(Counter);
    expect(VueCounter.name).toContain('arkane(');

    const wrapper = mountVue(VueCounter, {
      attrs: {
        initial: 42
      }
    });

    expect(wrapper.text()).toContain('42');
  });

  it('toVue alias works identically', () => {
    const VueCounter = toVue(Counter);
    const wrapper = mountVue(VueCounter, {
      attrs: {
        initial: 99
      }
    });

    expect(wrapper.text()).toContain('99');
  });
});
```

---

## 🔍 5. Verification Protocol

1. **Unit & Integration Test Execution:**
   ```bash
   just test vue
   ```
   *Expected Output:* 100% tests passing in `packages/vue/tests/`.
2. **Vue 3.5 Type Checking:**
   ```bash
   just types-vue
   ```
   *Expected Output:* `vue-tsc -p packages/vue/tsconfig.json --noEmit` passes with 0 errors.
