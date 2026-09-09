# RFC: Zero-Boilerplate Universal Vite 8 Compiler & Rolldown HMR Orchestrator

> **Status:** Specification Approved / Ready for Execution  
> **Target:** `@arkane/vite`, `@arkane/react`, `@arkane/vue`, `config/app.config.ts`  
> **Engine:** Vite 8.2+ (Environment API), Rolldown 1.2+ (Native Rust Bundler), Svelte 5 Runes, React 19, Vue 3.5  
> **Scope:** Monorepo DX, Environment-Scoped HMR, Rolldown Hook Filters, Transparent `.svelte` Component Interop

---

## 1. Executive Summary

Arkane bridges **Svelte 5 Runes** into **React 19** and **Vue 3.5**. Currently, this requires intermediate adapter modules (e.g. `apps/react/src/lib/mod.ts`), manual wrapper factories (`toReact()`, `toVue()`), or explicit virtual query imports (`?arkane`).

During development in monorepos, developers experience **dev server update stalls** and **HMR desynchronization**:
1. Top-level runtime wrappers (`export const Counter = toReact(SvelteCounter)`) break **React Fast Refresh** static analysis, causing updates to bubble past component boundaries and drop or force full page reloads.
2. Linux `inotify` watchers drop handles for shared components located outside the dev server root (e.g. `fixtures/components/*.svelte`).
3. The original RFC proposed legacy Vite 4/5 patterns (`handleHotUpdate`, `server.moduleGraph`, `server.ws.send`) which are deprecated or invalid in Vite 8's multi-environment architecture.

This specification defines the upgraded architecture for `@arkane/vite`, leveraging the **Vite 8 Environment API** and **Rolldown Rust-Native Hook Filters** to deliver:
- **Transparent Direct Imports:** `import Counter from './Counter.svelte'` inside React or Vue without wrappers or queries.
- **Environment-Aware HMR (`hotUpdate`):** Boundary-isolated hot updates via `this.environment.moduleGraph` and `this.environment.hot.send`.
- **Fast Refresh AST Invariance:** Emitting real named Function Components so React Fast Refresh preserves local state.
- **Svelte Sub-Component Pass-Through:** Preventing recursive wrapping when Svelte components import other Svelte components.
- **Rust Hook Filter Optimization:** Eliminating V8-to-Rust FFI overhead for non-Svelte modules using `rolldown/filter`.
- **Permanent Monorepo File Watching:** Workspace root anchoring via `searchForWorkspaceRoot`.

---

## 2. Root Cause Analysis

### 2.1 The Monorepo Watcher Boundary
- Dev servers execute with `root` set to individual app folders (e.g. `apps/react`, `apps/vue`).
- Shared UI primitives live in parent/sibling paths (`fixtures/components/Counter.svelte`).
- On Linux, `inotify` limits and default Vite watch trees restrict change notifications strictly to `root`.
- **Resolution:** Expand `server.fs.allow` to `searchForWorkspaceRoot(import.meta.dirname)` and declare negative ignore patterns in `server.watch.ignored: ['!**/fixtures/**', '!**/src/**']`.

### 2.2 The Runtime Wrapper "HMR Bubbling Trap"
- In the current codebase (`apps/react/src/lib/mod.ts`):
  ```ts
  export const Counter = toReact(SvelteCounter);
  ```
- React Fast Refresh uses AST heuristics: it requires exported components to be PascalCase function declarations or arrow function expressions returning JSX.
- Top-level runtime evaluations (`toReact(...)`) cannot be statically verified. Fast Refresh assumes the module has side-effects, marks the boundary as non-refreshable, and bubbles the update up to `App.tsx` or root, dropping the update or forcing full-page reload.
- **Resolution:** The virtual adapter module must emit a **syntactically valid React Function Component**:
  ```tsx
  export default function ArkaneReactBridge(props) {
    return React.createElement(Arkane, { this: SvelteComponent, ...props });
  }
  ```

### 2.3 Vite 8 Environment API Deprecations
- **Legacy:** `handleHotUpdate({ server, modules, file })` executed globally across mixed graphs.
- **Legacy:** `server.moduleGraph` provided an un-scoped, mixed-environment view.
- **Legacy:** `server.ws.send()` bypassed environment routing.
- **Vite 8 / Vite+ Standard:**
  - `hotUpdate(options: HotUpdateOptions)` is a **per-environment hook** exposing `this.environment` (`DevEnvironment`).
  - Module invalidation must operate on `this.environment.moduleGraph`.
  - HMR events must be dispatched via `(this.environment as DevEnvironment).hot.send()`.

### 2.4 The Svelte Sub-Component "Recursion Trap"
- If a Svelte component imports a child Svelte component (e.g. `Counter.svelte` imports `Button.svelte`), that import **must remain pure Svelte**.
- If the plugin blindly intercepts all `*.svelte` imports across the build, it would wrap `Button.svelte` in a React/Vue bridge inside `Counter.svelte`, corrupting the Svelte component tree.
- **Resolution:** Inspect `importer` in `resolveId`. If `importer.endsWith('.svelte')` or the query contains `?arkane-raw`, **pass through unmodified** to `@sveltejs/vite-plugin-svelte`.

---

## 3. Target Developer Experience (DX)

### React 19 Host (`apps/react/src/App.tsx`)
```tsx
// Direct import of native Svelte 5 component — no wrappers, no ?arkane query!
import Counter from '@sdk/ui/Counter.svelte';
// or relative:
// import Counter from '../../../fixtures/components/Counter.svelte';

export default function App() {
  return (
    <div className="p-8">
      <h1>React 19 Host</h1>
      <Counter initial={42} onchange={(count) => console.log('Count:', count)} />
    </div>
  );
}
```

### Vue 3.5 Host (`apps/vue/src/App.vue`)
```vue
<script setup lang="ts">
// Direct import of native Svelte 5 component — automatically a Vue component!
import Counter from '@sdk/ui/Counter.svelte';
</script>

<template>
  <div class="p-8">
    <h1>Vue 3.5 Host</h1>
    <Counter :initial="42" @change="(count) => console.log('Count:', count)" />
  </div>
</template>
```

---

## 4. Architectural Blueprint: Vite 8 & Rolldown Pipeline

```
                     ┌───────────────────────────────────────────────────────────┐
                     │          Vite 8 & Rolldown Development Server             │
                     └─────────────────────────────┬─────────────────────────────┘
                                                   │
                            [1] config & configResolved Hooks
                            • server.fs.allow += searchForWorkspaceRoot(...)
                            • server.watch.ignored: ['!**/fixtures/**', '!**/src/**']
                            • Auto-detect target: 'react' | 'vue' (inspect plugins)
                                                   │
                                                   ▼
                            [2] resolveId Hook (Rolldown Rust Filter)
                            • Filter: filter: { id: /\.svelte(\?.*)?$/ }
                            • Importer Check:
                              - If importer ends with '.svelte' -> PASS THROUGH (Pure Svelte)
                              - If query has '?arkane-raw'     -> PASS THROUGH (Pure Svelte)
                              - If imported by React/Vue host  -> Route to: \0arkane:${target}:${cleanPath}
                                                   │
                                                   ▼
                            [3] load Hook (Rolldown Rust Filter)
                            • Filter: filter: { id: prefixRegex('\0arkane:') }
                            • React Host: Emit Function Component ArkaneReactBridge(props)
                            • Vue Host: Emit defineComponent ArkaneVueBridge(props)
                            • Delegate Svelte compilation via: import Comp from '${path}?arkane-raw'
                                                   │
                                                   ▼
                            [4] hotUpdate Hook (Vite 8 Environment API)
                            • Per-environment hook (this.environment as DevEnvironment)
                            • Intercept changed *.svelte files
                            • Invalidate \0arkane:* virtual modules in this.environment.moduleGraph
                            • Dispatch devEnv.hot.send('arkane:hmr-reload', { file })
                            • Return affected virtual modules -> Isolate HMR boundary
```

### 4.1 Framework Target Auto-Detection
In `configResolved(resolvedConfig)`:
```ts
const pluginNames = new Set(resolvedConfig.plugins.map((p) => p.name));
if (options.target && options.target !== 'auto') {
  this.target = options.target;
} else if (pluginNames.has('vite:vue') || pluginNames.has('@vitejs/plugin-vue')) {
  this.target = 'vue';
} else {
  // Default to React (matches vite:react-babel, vite:react-swc, vite:react-oxc, @vitejs/plugin-react)
  this.target = 'react';
}
```

### 4.2 Rolldown Rust Hook Filters (`rolldown/filter`)
```ts
import { prefixRegex } from 'rolldown/filter';

// 1. Rust-level filtering for module resolution
resolveId: {
  filter: { id: /\.svelte(\?.*)?$/ },
  async handler(source, importer) {
    if (source.includes('?arkane-raw') || importer?.endsWith('.svelte')) {
      return null; // Pass to @sveltejs/vite-plugin-svelte
    }
    const resolved = await this.resolve(source, importer, { skipSelf: true });
    if (!resolved || resolved.external) return null;

    const cleanPath = resolved.id.replace(/\?.*$/, '');
    return `\0arkane:${this.target}:${cleanPath}`;
  }
},

// 2. Rust-level filtering for virtual module loading
load: {
  filter: { id: prefixRegex('\0arkane:') },
  handler(id) {
    const isReact = id.startsWith('\0arkane:react:');
    const isVue = id.startsWith('\0arkane:vue:');
    const sveltePath = id.replace(/^\0arkane:(react|vue):/, '');
    const rawImport = `${sveltePath}?arkane-raw`;

    if (isReact) {
      return `
        import React from 'react';
        import { Arkane } from '@arkane/react';
        import SvelteComponent from '${rawImport}';

        export default function ArkaneReactBridge(props) {
          return React.createElement(Arkane, { this: SvelteComponent, ...props });
        }
        export * from '${rawImport}';
      `;
    }

    if (isVue) {
      return `
        import { defineComponent, h } from 'vue';
        import { Arkane } from '@arkane/vue';
        import SvelteComponent from '${rawImport}';

        export default defineComponent({
          name: 'ArkaneVueBridge',
          inheritAttrs: false,
          setup(_, { attrs, slots }) {
            return () => h(Arkane, { this: SvelteComponent, ...attrs }, slots);
          }
        });
        export * from '${rawImport}';
      `;
    }
    return null;
  }
}
```

### 4.3 Environment-Scoped HMR Hook (`hotUpdate`)
```ts
hotUpdate(options: HotUpdateOptions) {
  const { file, modules, timestamp } = options;
  if (!file.endsWith('.svelte')) return modules;

  const devEnv = this.environment as DevEnvironment;
  if (!devEnv || !devEnv.moduleGraph) return modules;

  // Locate all virtual adapters referencing the modified Svelte file in this environment
  const affectedAdapters = Array.from(devEnv.moduleGraph.idToModuleMap.values()).filter(
    (m) => m.id?.startsWith('\0arkane:') && m.id.includes(file)
  );

  for (const mod of affectedAdapters) {
    devEnv.moduleGraph.invalidateModule(mod);
  }

  // Scoped WebSocket push via Environment API
  devEnv.hot.send({
    type: 'custom',
    event: 'arkane:hmr-reload',
    data: { file, timestamp }
  });

  // Return affected virtual modules to isolate update to the adapter boundary
  return affectedAdapters;
}
```

### 4.4 SSR Readiness via Environment API
In Vite 8, plugins distinguish SSR compilation without legacy boolean flags:
```ts
const isSsr = this.environment.name === 'ssr' || 
              this.environment.config.consumer === 'server';
```
When `isSsr` is true, the adapter can synthesize server-safe rendering primitives (e.g. Svelte 5 `render` from `svelte/server`) rather than client-only DOM `mount`.

---

## 5. Implementation Roadmap & Verification Gates

| Phase | Component | Deliverables & Actions | Verification Gate |
| :--- | :--- | :--- | :--- |
| **Phase 1: Workspace Watcher** | `config/app.config.ts` | Add `searchForWorkspaceRoot` to `server.fs.allow`. Add negative ignore rules to `server.watch.ignored`. | `deno run -A npm:vite dev` watches edits in `fixtures/components/*.svelte` |
| **Phase 2: Core Vite 8 Plugin** | `src/vite/src/plugin.ts` | Implement `resolveId` and `load` with Rolldown filters, virtual ID `\0arkane:*`, raw delegation `?arkane-raw`, and importer guard. | Vitest unit tests in `src/vite/tests/plugin.test.ts` pass |
| **Phase 3: Fast Refresh Invariance** | `src/vite/src/plugin.ts` | Emit AST-compliant named function component for React and `defineComponent` for Vue. | React Fast Refresh preserves local state across edits |
| **Phase 4: Environment HMR** | `src/vite/src/plugin.ts`, `hmr.ts` | Implement Vite 8 `hotUpdate` using `this.environment.moduleGraph` and `this.environment.hot.send`. Deprecate legacy `handleArkaneHmr`. | Live component edits update in-place without page reload |
| **Phase 5: App Integration & DX** | `apps/react`, `apps/vue` | Delete manual `src/lib/mod.ts` wrappers. Import directly in `App.tsx` and `App.vue`. | Full test suite passes: `deno run -A npm:vitest run --config ./config/vitest.config.ts` |
