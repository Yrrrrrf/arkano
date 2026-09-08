# 📋 Phase 1 Specification: Workspace Topology, Pruning & CI Harness

> **Target Goal:** Transform the repository from an outdated full-stack template into a clean, modern multi-package monorepo for **Arkane**, preserving `config/fallowrc.json`, establishing the `packages/` layout, and implementing the 5-verb CI harness powered by **Nushell**, **Just**, and **Jujutsu (`jj`)**.

---

## 🎯 1. Phase Objectives

1. **Preserve High-Value Assets:**
   - Keep `config/fallowrc.json` and update its entrypaths to target `packages/**` and `fixtures/**`.
   - Migrate `sdk/ui/src/counter.svelte` and `sdk/ui/src/icon.svelte` into `fixtures/components/`.
2. **Prune Legacy Clutter:**
   - Remove obsolete directories: `sdk/api`, `sdk/core`, `sdk/state`, `sdk/ui/src/i18n/`, `sdk/ui/src/sdk-badge.svelte`, `sdk/ui/src/showcase.svelte`.
   - Remove broken `scripts/cli/` (`main.ts`, `gates.ts`, `workspace.ts`) which imported missing external packages.
   - Safely retire the remainder of `sdk/`.
3. **Establish Monorepo Infrastructure:**
   - Initialize package roots: `packages/core`, `packages/react`, `packages/vue`, `packages/vite`, `packages/cli`.
   - Configure root `deno.json` with workspace entries and modern import aliases.
   - Configure root `package.json` for npm package management.
   - Update `config/biome.json`, `config/vitest.config.ts`, and `config/tsconfig.json`.
4. **Implement 5-Verb CI Harness:**
   - Author `justfile`, `scripts/_shared.just`, `scripts/dev.just`, `scripts/check.just`, `scripts/test.just`, and `scripts/deploy.just`.
   - Enforce Nushell execution (`set shell := ["nu", "-c"]`).
   - Integrate dual VCS hygiene (Jujutsu conflict/divergence checking + Git status).
   - Support `just audit` and `just health` using `fallow`!

---

## 📁 2. File Operations Directory

| Operation | Target Path | Description |
| :--- | :--- | :--- |
| **CREATE DIR** | `fixtures/components/` | Destination for canonical Svelte 5 test fixtures. |
| **CREATE DIR** | `packages/core/src/`, `packages/react/src/`, `packages/vue/src/`, `packages/vite/src/`, `packages/cli/src/` | Package source roots. |
| **COPY** | `sdk/ui/src/counter.svelte` ➔ `fixtures/components/Counter.svelte` | Preserve DaisyUI / `$bindable` fixture. |
| **COPY** | `sdk/ui/src/icon.svelte` ➔ `fixtures/components/Icon.svelte` | Preserve `$derived.by` SVG route fixture. |
| **DELETE** | `sdk/` | Remove entire legacy sdk directory after copying fixtures. |
| **DELETE** | `scripts/cli/` | Remove broken CLI driver. |
| **UPDATE** | `config/fallowrc.json` | Reconfigure fallow entry points for `packages/**` and `fixtures/**`. |
| **UPDATE** | `config/biome.json` | Set includes to `packages/**`, `fixtures/**`, `config/**`, `scripts/**`. |
| **UPDATE** | `config/vitest.config.ts` | Multi-project discovery for `packages/**`. |
| **UPDATE** | `config/tsconfig.json` | Base compiler options with clean path aliases. |
| **CREATE** | `deno.json` | Workspace descriptor and central import map. |
| **CREATE** | `package.json` | Root npm package configuration. |
| **UPDATE** | `justfile` | Root orchestrator. |
| **UPDATE** | `scripts/_shared.just` | Variables, gum helpers, and `_clean-tree` (Jujutsu + Git). |
| **UPDATE** | `scripts/dev.just` | `prune`, `prepare`, `dev`. |
| **UPDATE** | `scripts/check.just` | `fmt`, `lint`, `audit`, `health`, `types-*`, `check`. |
| **UPDATE** | `scripts/test.just` | `test`, `coverage`. |
| **UPDATE** | `scripts/deploy.just` | `ci`, `build`, `preview`. |

---

## 💻 3. Verbatim Source Code Implementations

### 3.1 `config/fallowrc.json`
```json
{
  "$schema": "https://raw.githubusercontent.com/fallow-rs/fallow/main/schema.json",
  "entry": ["packages/**/src/index.ts", "packages/cli/src/bin.ts", "fixtures/**"],
  "ignorePatterns": ["config/**", "scripts/**", "**/*.test.*"]
}
```

### 3.2 `config/biome.json`
```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.15/schema.json",
  "root": true,
  "files": {
    "ignoreUnknown": true,
    "includes": [
      "packages/**",
      "fixtures/**",
      "config/**",
      "scripts/**",
      "!**/dist/**",
      "!**/build/**",
      "!**/node_modules/**",
      "!**/.svelte-kit/**",
      "!**/.vite/**",
      "!**/.justcache/**"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always"
    }
  }
}
```

### 3.3 `config/tsconfig.json`
```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "DOM.Iterable", "DOM.AsyncIterable"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "checkJs": false,
    "allowJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@arkane/core": ["../packages/core/src/index.ts"],
      "@arkane/react": ["../packages/react/src/index.ts"],
      "@arkane/vue": ["../packages/vue/src/index.ts"],
      "@arkane/vite": ["../packages/vite/src/index.ts"],
      "@arkane/cli": ["../packages/cli/src/index.ts"],
      "#fixtures/*": ["../fixtures/*"]
    }
  },
  "exclude": [
    ".*",
    "dist/**",
    "build/**",
    "node_modules/**"
  ]
}
```

### 3.4 `config/vitest.config.ts`
```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    globals: true,
    projects: [
      './packages/*/vitest.config.ts',
      './packages/*/vite.config.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.jj/**',
      '**/dist/**',
      '**/build/**'
    ]
  }
});
```

### 3.5 Root `deno.json`
```json
{
  "name": "arkane",
  "version": "1.0.0",
  "description": "Universal Svelte 5 Runes Conduit for React 19 & Vue 3.5",
  "license": "MIT",
  "nodeModulesDir": "auto",
  "workspace": [
    "./packages/*"
  ],
  "imports": {
    "@arkane/core": "./packages/core/src/index.ts",
    "@arkane/react": "./packages/react/src/index.ts",
    "@arkane/vue": "./packages/vue/src/index.ts",
    "@arkane/vite": "./packages/vite/src/index.ts",
    "@arkane/cli": "./packages/cli/src/index.ts",
    "svelte": "npm:svelte@>=5.56.0",
    "react": "npm:react@>=19.0.0",
    "react-dom": "npm:react-dom@>=19.0.0",
    "vue": "npm:vue@>=3.5.0",
    "vite": "npm:vite@>=6.0.0",
    "arktype": "npm:arktype@>=2.0.0",
    "@cliffy/command": "jsr:@cliffy/command@1.0.0-rc.7",
    "@cliffy/table": "jsr:@cliffy/table@1.0.0-rc.7",
    "@cliffy/ansi": "jsr:@cliffy/ansi@1.0.0-rc.7",
    "vite-plus": "npm:vite-plus@latest"
  }
}
```

### 3.6 Root `package.json`
```json
{
  "name": "arkane",
  "version": "1.0.0",
  "description": "Universal Svelte 5 Runes Conduit for React 19 & Vue 3.5",
  "type": "module",
  "license": "MIT",
  "exports": {
    ".": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core/index.js",
      "require": "./dist/core/index.cjs"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.js",
      "require": "./dist/react/index.cjs"
    },
    "./vue": {
      "types": "./dist/vue/index.d.ts",
      "import": "./dist/vue/index.js",
      "require": "./dist/vue/index.cjs"
    },
    "./vite": {
      "types": "./dist/vite/index.d.ts",
      "import": "./dist/vite/index.js",
      "require": "./dist/vite/index.cjs"
    }
  },
  "bin": {
    "arkane": "./dist/cli/bin.js"
  },
  "peerDependencies": {
    "svelte": ">=5.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "react-dom": { "optional": true },
    "vue": { "optional": true },
    "vite": { "optional": true }
  }
}
```

### 3.7 Root `justfile`
```just
# justfile — Arkane Root Harness
# Universal Svelte 5 Runes Conduit for React 19 & Vue 3.5

set shell := ["nu", "-c"]
set script-interpreter := ["nu"]

import 'scripts/_shared.just'
import 'scripts/dev.just'
import 'scripts/check.just'
import 'scripts/test.just'
import 'scripts/deploy.just'
```

### 3.8 `scripts/_shared.just`
```just
# _shared.just — Front door, variables, and VCS hygiene

PROJECT := "arkane"
VERSION := `git describe --tags --always --dirty 2>/dev/null || echo "1.0.0-dev"`

[default]
[doc('List all available recipes in grouped format')]
[group('meta')]
list:
    @just --list --unsorted

[doc('Interactive recipe autocomplete menu via gum')]
[group('meta')]
[script]
menu:
    let recipes = (just --summary | str trim | split row ' ')
    if (which gum | is-not-empty) {
        let choice = ($recipes | str join "\n" | ^gum filter --placeholder ($"($PROJECT) recipe...")) | str trim
        if ($choice | is-not-empty) { just $choice }
    } else {
        just list
    }

[private]
[group('meta')]
[script]
_banner msg:
    if (which gum | is-not-empty) {
        ^gum style --foreground 212 --border rounded --padding "0 2" "{{msg}}"
    } else {
        print $"\n===> {{msg}}\n"
    }

[private]
[group('meta')]
[script]
_clean-tree:
    let has_jj = (path exists ".jj") or ((do { ^jj root } | complete).exit_code == 0)
    let has_git = (path exists ".git") or ((do { ^git rev-parse --is-inside-work-tree } | complete).exit_code == 0)

    if not $has_jj and not $has_git {
        print "Notice: No VCS repository (.jj or .git) detected. Skipping tree cleanliness check."
        return
    }

    if $has_jj {
        print "Checking Jujutsu (jj) hygiene..."
        let conflicts = (do { ^jj log -r 'conflicts()' --no-graph -T 'change_id ++ "\n"' --ignore-working-copy --color=never } | complete)
        if $conflicts.exit_code == 0 and ($conflicts.stdout | str trim | is-not-empty) {
            error make { msg: $"Jujutsu conflicts detected in revisions:\n($conflicts.stdout)" }
        }

        let divergent = (do { ^jj log -r 'divergent()' --no-graph -T 'change_id ++ "\n"' --ignore-working-copy --color=never } | complete)
        if $divergent.exit_code == 0 and ($divergent.stdout | str trim | is-not-empty) {
            error make { msg: $"Jujutsu divergent revisions detected:\n($divergent.stdout)" }
        }

        let diff = (do { ^jj diff -r @ --color=never } | complete)
        if $diff.exit_code == 0 and ($diff.stdout | str trim | is-not-empty) {
            error make { msg: "Jujutsu working copy (@) has uncommitted changes. Run 'jj new' or 'jj squash' before releasing." }
        }
    }

    if $has_git {
        print "Checking Git hygiene..."
        let status = (do { ^git status --porcelain=v1 } | complete)
        if $status.exit_code == 0 and ($status.stdout | str trim | is-not-empty) {
            error make { msg: $"Git working tree is dirty:\n($status.stdout)" }
        }
    }

    print "✓ VCS hygiene verified: working tree clean and conflict-free."
```

### 3.9 `scripts/dev.just`
```just
# dev.just — Developer loop & maintenance

[doc('Prune node_modules, build artifacts, and caches')]
[group('dev')]
[script]
prune:
    let targets = [
        "node_modules"
        ".svelte-kit"
        ".vite"
        "dist"
        "build"
        ".justcache"
    ]
    for target in $targets {
        if ($target | path exists) {
            rm -r -f $target
            print $"pruned: ($target)"
        }
    }
    print "✓ Workspace caches pruned."

[doc('Clean and reinstall workspace dependencies')]
[group('dev')]
prepare: prune
    ^deno install

[doc('Start playground dev server')]
[group('dev')]
dev:
    ^deno run -A npm:vite
```

### 3.10 `scripts/check.just`
```just
# check.just — Formatters, linters, code auditors, and type gates

[doc('Format workspace using Biome (in-place fix)')]
[group('check')]
fmt:
    ^deno run -A npm:@biomejs/biome format --config-path=config/biome.json --write .

[doc('Verify workspace formatting (read-only verification)')]
[group('check')]
fmt-check:
    ^deno run -A npm:@biomejs/biome format --config-path=config/biome.json .

[doc('Lint workspace using Biome (in-place fix)')]
[group('check')]
lint:
    ^deno run -A npm:@biomejs/biome lint --config-path=config/biome.json --write .

[doc('Verify workspace linting (read-only zero-warning gate)')]
[group('check')]
lint-check:
    ^deno run -A npm:@biomejs/biome lint --config-path=config/biome.json .

[doc('Audit code namespaces for unused exports and dead code (Fallow)')]
[group('check')]
audit:
    ^deno run -A npm:fallow -c config/fallowrc.json

[doc('Check code health score via Fallow')]
[group('check')]
health:
    ^deno run -A npm:fallow health --score -c config/fallowrc.json

[doc('Type-check Deno & core TypeScript modules')]
[group('check')]
types-core:
    ^deno check packages/core/src/index.ts packages/vite/src/index.ts packages/cli/src/bin.ts

[doc('Type-check Svelte 5 Runes mode')]
[group('check')]
types-svelte:
    ^deno run -A npm:svelte-check --tsconfig ./config/tsconfig.json --threshold error

[doc('Type-check React 19 adapters and JSX types (tsc)')]
[group('check')]
types-react:
    ^deno run -A npm:typescript@6/tsc -p ./config/tsconfig.json --noEmit

[doc('Type-check Vue 3.5 adapters and definitions (vue-tsc)')]
[group('check')]
types-vue:
    ^deno run -A npm:vue-tsc -p ./config/tsconfig.json --noEmit

[doc('Execute complete multi-engine type checking matrix')]
[group('check')]
[script]
types:
    print "▶ [1/4] Checking Core TypeScript modules (deno check)..."
    just types-core
    print "▶ [2/4] Checking Svelte 5 Runes (svelte-check)..."
    just types-svelte
    print "▶ [3/4] Checking React 19 definitions (tsc)..."
    just types-react
    print "▶ [4/4] Checking Vue 3.5 definitions (vue-tsc)..."
    just types-vue
    print "✓ Multi-engine type checking matrix passed."

[doc('Run all check quality gates (fmt, lint, audit, types)')]
[group('check')]
check: fmt lint audit types
```

### 3.11 `scripts/test.just`
```just
# test.just — Vitest suite execution

[doc('Run unit and integration test suite via Vitest')]
[group('test')]
[arg('filter', short, long, help='Filter test files by pattern')]
test filter='':
    ^deno run -A npm:vitest run --config ./config/vitest.config.ts {{ if filter != "" { filter } else { "" } }}

[doc('Run test suite with code coverage')]
[group('test')]
coverage:
    ^deno run -A npm:vitest run --coverage --config ./config/vitest.config.ts
```

### 3.12 `scripts/deploy.just`
```just
# deploy.just — Convergence CI, packaging, and release

[doc('CI quality gate convergence: format-check + lint-check + audit + types + test')]
[group('ci')]
[script]
ci:
    _banner "RUNNING ARKANE CI CONVERGENCE GATE"
    print "▶ [Phase 1/5] Biome Formatting Verification..."
    just fmt-check
    print "▶ [Phase 2/5] Biome Lint Verification..."
    just lint-check
    print "▶ [Phase 3/5] Fallow Code Audit..."
    just audit
    print "▶ [Phase 4/5] Multi-Engine Type Matrix..."
    just types
    print "▶ [Phase 5/5] Vitest Test Suite..."
    just test
    print "\n🎉 ALL CI GATES GREEN — CONVERGENCE PASSED."

[doc('Package Arkane distribution via tsdown')]
[group('deploy')]
build:
    ^deno run -A npm:tsdown --config ./tsdown.config.ts

[doc('Preview build distribution')]
[group('deploy')]
preview: build
    ^deno run -A npm:vite preview

[doc('Publish Arkane release (gated by CI and clean tree)')]
[group('deploy')]
[confirm("Ship release to production?")]
publish: _clean-tree ci build
    _banner "shipping {{PROJECT}} {{VERSION}}"
    @print "Published {{PROJECT}} {{VERSION}} successfully"
```

---

## 🔍 4. Step-by-Step Implementation Instructions

1. **Migrate Fixtures:**
   ```bash
   mkdir -p fixtures/components packages/core/src packages/react/src packages/vue/src packages/vite/src packages/cli/src
   cp sdk/ui/src/counter.svelte fixtures/components/Counter.svelte
   cp sdk/ui/src/icon.svelte fixtures/components/Icon.svelte
   ```
2. **Remove Deprecated Directories:**
   ```bash
   rm -rf sdk scripts/cli
   ```
3. **Write Configuration Files:**
   - Update `config/fallowrc.json`, `config/biome.json`, `config/vitest.config.ts`, and `config/tsconfig.json` with the verbatim contents above.
   - Write root `deno.json` and `package.json`.
4. **Deploy Justfile Suite:**
   - Write `justfile`, `scripts/_shared.just`, `scripts/dev.just`, `scripts/check.just`, `scripts/test.just`, and `scripts/deploy.just`.

---

## ✅ 5. Acceptance & Verification Protocol

Run the following commands in sequence to verify Phase 1 completion:

1. **Recipe Listing Check:**
   ```bash
   just list
   ```
   *Expected Output:* Clean list of recipes grouped under `meta`, `dev`, `check`, `test`, `ci`, and `deploy`. Zero syntax errors.
2. **Biome Format & Lint Check:**
   ```bash
   just fmt
   just lint
   ```
   *Expected Output:* Formatter processes workspace; zero fatal lint errors.
3. **Fallow Audit Check:**
   ```bash
   just audit
   ```
   *Expected Output:* Fallow scans `packages/**` and `fixtures/**` according to `config/fallowrc.json`.
4. **VCS Cleanliness Check:**
   ```bash
   just _clean-tree
   ```
   *Expected Output:* Identifies jj or git repository and confirms tree hygiene.
