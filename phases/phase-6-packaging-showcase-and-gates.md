# 🚀 Phase 6 Specification: Multi-Target Packaging (`tsdown`), Showcase & Quality Gate Matrix

> **Target Goal:** Complete the distribution pipeline, multi-target bundling via **tsdown / Rolldown**, build-time type emission via **Oxc isolated declarations**, end-to-end multi-framework showcase verification, and execution of the complete Arkane Quality Gate Matrix (`just ci`).

---

## 🎯 1. Phase Objectives

1. **Dual ESM/CJS & Isolated Declarations (`tsdown.config.ts`):**
   - Bundle all package entrypoints (`@arkane/core`, `@arkane/react`, `@arkane/vue`, `@arkane/vite`, `@arkane/cli`) using **Rolldown** and **tsdown**.
   - Generate fast, isolated TypeScript declarations (`.d.ts`) powered by Oxc.
   - Output clean distribution artifacts to `dist/`.
2. **End-to-End Showcase & Cross-Boundary Layout Test:**
   - Verify Arkane's architectural thesis: layout-invisibility (`display: contents`).
   - Demonstrate DaisyUI `.join` container button group and theme cascade (`data-theme="dark"`) functioning unimpeded across React, Vue, and Svelte.
3. **Convergence Quality Gate Matrix (`just ci`):**
   - Execute the 5-layer quality gate:
     1. `just fmt-check` (Biome format)
     2. `just lint-check` (Biome lint, zero warnings)
     3. `just audit` & `just health` (Fallow unused code and health score)
     4. `just types` (`deno check`, `svelte-check`, `tsc`, `vue-tsc`)
     5. `just test` (Vitest unit & integration test suite)
     6. `just build` (tsdown bundle output)
4. **Master Orchestrator Sign-off Protocol:**
   - Comprehensive checklist verifying all criteria before final delivery.

---

## 📁 2. File Operations Directory

| Operation | Target Path | Description |
| :--- | :--- | :--- |
| **CREATE** | `tsdown.config.ts` | Multi-entry Rolldown bundle configuration. |
| **CREATE** | `fixtures/showcase.test.tsx` | End-to-end integration test verifying layout-invisibility and theme cascade. |
| **VERIFY** | `justfile` & `scripts/*.just` | Run full automated CI convergence gate. |

---

## 💻 3. Verbatim Source Code Implementations

### 3.1 `tsdown.config.ts`
```ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    'core/index': 'packages/core/src/index.ts',
    'react/index': 'packages/react/src/index.ts',
    'vue/index': 'packages/vue/src/index.ts',
    'vite/index': 'packages/vite/src/index.ts',
    'cli/bin': 'packages/cli/src/bin.ts'
  },
  format: ['esm', 'cjs'],
  dts: {
    isolatedDeclarations: true
  },
  clean: true,
  bundleless: false,
  platform: 'neutral',
  external: [
    'svelte',
    'react',
    'react-dom',
    'vue',
    'vite',
    'arktype',
    '@cliffy/command',
    '@cliffy/table',
    '@cliffy/ansi'
  ]
});
```

### 3.2 `fixtures/showcase.test.tsx`
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { arkane as reactArkane } from '../packages/react/src/index.ts';
import { mount as mountVue } from '@vue/test-utils';
import { arkane as vueArkane } from '../packages/vue/src/index.ts';
// @ts-ignore - Svelte fixture import
import Counter from './components/Counter.svelte';
// @ts-ignore - Svelte fixture import
import Icon from './components/Icon.svelte';

describe('Arkane Universal Host End-to-End Showcase', () => {
  it('mounts Svelte Counter in React 19 inside DaisyUI .join container with display: contents', () => {
    const ReactCounter = reactArkane(Counter);

    const { container } = render(
      <div data-theme="synthwave" className="p-4">
        {/* DaisyUI join container expects direct flex children without element boxes */}
        <div className="join">
          <button type="button" className="btn join-item">React Native Button</button>
          <ReactCounter initial={10} className="join-item" />
        </div>
      </div>
    );

    // Assert host wrapper exists with display: contents
    const hostSpan = container.querySelector('span[style*="display: contents"]');
    expect(hostSpan).not.toBeNull();

    // Assert button inside Svelte component rendered
    expect(screen.getByText('10')).not.toBeNull();
    expect(screen.getByText('Increment')).not.toBeNull();
  });

  it('mounts Svelte Icon in Vue 3.5 with dynamic route derived paths', () => {
    const VueIcon = vueArkane(Icon);

    const wrapper = mountVue(VueIcon, {
      attrs: {
        route: '/dashboard',
        size: 32
      }
    });

    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('width')).toBe('32');
  });
});
```

---

## 🛡️ 4. The Complete Quality Gate Execution Protocol

The executing agent must run each gate in strict sequence and ensure 100% compliance:

### Step 1: VCS Cleanliness Verification
```bash
just _clean-tree
```
- **Evaluation:** Must report tree cleanliness. In Jujutsu, no conflicted commits (`conflicts()`), no divergent revisions (`divergent()`), and `@` must not have uncheckpointed changes. In Git, working tree must be clean.

### Step 2: Workspace Formatting
```bash
just fmt
just fmt-check
```
- **Evaluation:** Biome formats all files in `packages/**`, `fixtures/**`, `config/**`, and `scripts/**`. `fmt-check` returns exit code 0.

### Step 3: Linting Zero-Warning Gate
```bash
just lint
just lint-check
```
- **Evaluation:** Biome reports `0 errors, 0 warnings`. The `-` error-suppression sigil is strictly omitted.

### Step 4: Fallow Code Audit & Health
```bash
just audit
just health
```
- **Evaluation:** Fallow parses `config/fallowrc.json`, scans package entrypoints and fixtures, and passes health score verification.

### Step 5: Multi-Engine Type Matrix
```bash
just types
```
This runs the 4-layer type verification:
1. `types-core`: `deno check packages/core/src/index.ts packages/vite/src/index.ts packages/cli/src/bin.ts`
2. `types-svelte`: `svelte-check --tsconfig ./config/tsconfig.json --threshold error`
3. `types-react`: `tsc -p ./config/tsconfig.json --noEmit`
4. `types-vue`: `vue-tsc -p ./config/tsconfig.json --noEmit`
- **Evaluation:** All 4 checkers report 0 type errors.

### Step 6: Vitest Multi-Project Suite
```bash
just test
```
- **Evaluation:** Runs core, react, vue, vite, cli, and showcase tests. All test suites pass 100%.

### Step 7: Multi-Target Distribution Build
```bash
just build
```
- **Evaluation:** `tsdown` compiles:
  - `dist/core/index.js` & `dist/core/index.cjs` & `dist/core/index.d.ts`
  - `dist/react/index.js` & `dist/react/index.cjs` & `dist/react/index.d.ts`
  - `dist/vue/index.js` & `dist/vue/index.cjs` & `dist/vue/index.d.ts`
  - `dist/vite/index.js` & `dist/vite/index.cjs` & `dist/vite/index.d.ts`
  - `dist/cli/bin.js` & `dist/cli/bin.cjs`
  All files emitted without build errors.

### Step 8: Convergence Gate Execution
```bash
just ci
```
- **Evaluation:** Full automated run: formatting ➔ linting ➔ audit ➔ types ➔ tests ➔ build. Prints:
  ```text
  🎉 ALL CI GATES GREEN — CONVERGENCE PASSED.
  ```

---

## 📋 5. Master Orchestrator Acceptance Evaluation Checklist

Before declaring the Arkane implementation complete, verify:

- [ ] **Workspace Cleanliness:** Obsolete directories (`sdk/api`, `sdk/core`, `sdk/state`, `sdk/ui/src/i18n`, `scripts/cli`) are removed.
- [ ] **Fallow Preserved:** `config/fallowrc.json` is intact and `just audit` passes.
- [ ] **Fixtures Active:** `Counter.svelte` and `Icon.svelte` exist in `fixtures/components/` and are utilized in integration tests.
- [ ] **Core Engine:** `$state` fine-grained proxy mutates in-place on `reconcile()` without changing proxy reference or triggering component remounts.
- [ ] **Event Normalizer:** `onClick` maps to `onclick`, custom events normalized, and both casing variants preserved.
- [ ] **React 19 Host:** `<Arkane />` renders `display: contents`, supports direct `ref` prop, and updates Svelte state without remounts.
- [ ] **Vue 3.5 Host:** `<Arkane />` renders `display: contents`, uses Vue 3.5 `defineComponent` + `watch(..., { deep: true })`, and updates state smoothly.
- [ ] **Vite Plugin:** Virtual query `?arkane` resolves cleanly and transforms modules in memory for React and Vue targets.
- [ ] **Cliffy CLI:** `arkane generate` generates valid `.tsx` and `.ts` component adapter files with CLI table output.
- [ ] **Packaging:** `tsdown` produces clean dual ESM/CJS bundles with Oxc isolated `.d.ts` declarations.
- [ ] **CI Pipeline:** `just ci` runs the entire 5-phase convergence pipeline and exits with status 0.
