# ⚡ Phase 5 Specification: `@arkane/vite` Plugin & `@arkane/cli` Engine

> **Target Goal:** Implement build-time automation and static codegen tooling:
> 1. **`@arkane/vite`:** Vite 6+ & Rolldown plugin intercepting `.svelte?arkane` queries for zero-file on-the-fly component wrapping with HMR.
> 2. **`@arkane/cli`:** Cliffy-based command-line tool generating static `.tsx` and `.ts` wrappers with full TypeScript `.d.ts` declarations for standalone distribution.

---

## 🎯 1. Phase Objectives

1. **Vite / Rolldown Query Resolver (`packages/vite/src/plugin.ts`):**
   - Intercept module requests matching `?arkane`, `?arkane=react`, or `?arkane=vue`.
   - Run as `enforce: 'post'` to ensure Svelte components are compiled by `@sveltejs/vite-plugin-svelte` first.
   - Return dynamic virtual wrapper code importing `@arkane/react` or `@arkane/vue` and exporting the adapted component with re-exported types.
2. **Cross-Boundary HMR Coordinator (`packages/vite/src/hmr.ts`):**
   - Propagate hot updates from Svelte component files into the foreign host component tree without requiring full-page reloads.
3. **Svelte AST & File Scanner (`packages/cli/src/scanner.ts`):**
   - Recursively scan a source directory for `.svelte` components.
   - Extract component names and relative paths.
4. **Adapter Code Emitter (`packages/cli/src/emitter.ts`):**
   - Emit typed `.tsx` wrappers for React 19 with Svelte `ComponentProps` type inference.
   - Emit typed `.ts` wrappers for Vue 3.5.
5. **Cliffy CLI Command (`packages/cli/src/bin.ts`):**
   - Provide an ergonomic CLI interface using `@cliffy/command`, `@cliffy/table`, and `@cliffy/ansi/colors`:
     ```bash
     arkane generate --in ./fixtures/components --out ./dist/adapters --target all
     ```
6. **Testing Verification (`tests/`):**
   - Vitest tests for Vite plugin `resolveId` and `transform` methods.
   - Vitest tests for CLI scanner and wrapper emitter.

---

## 📁 2. File Operations Directory

| Operation | Target Path | Description |
| :--- | :--- | :--- |
| **CREATE** | `packages/vite/package.json` | Vite plugin package manifest. |
| **CREATE** | `packages/vite/tsconfig.json` | TypeScript configuration for Vite plugin. |
| **CREATE** | `packages/vite/vitest.config.ts` | Vitest configuration for Vite plugin tests. |
| **CREATE** | `packages/vite/src/plugin.ts` | Vite / Rolldown virtual query plugin. |
| **CREATE** | `packages/vite/src/hmr.ts` | HMR coordinator. |
| **CREATE** | `packages/vite/src/index.ts` | Vite plugin exports. |
| **CREATE** | `packages/vite/tests/plugin.test.ts` | Unit tests for Vite plugin query resolution. |
| **CREATE** | `packages/cli/package.json` | CLI package manifest with binary entry. |
| **CREATE** | `packages/cli/tsconfig.json` | TypeScript configuration for CLI. |
| **CREATE** | `packages/cli/vitest.config.ts` | Vitest configuration for CLI tests. |
| **CREATE** | `packages/cli/src/scanner.ts` | Svelte component file scanner. |
| **CREATE** | `packages/cli/src/emitter.ts` | Code generation emitter. |
| **CREATE** | `packages/cli/src/bin.ts` | Cliffy executable CLI entrypoint. |
| **CREATE** | `packages/cli/src/index.ts` | Library exports for programmatic usage. |
| **CREATE** | `packages/cli/tests/emitter.test.ts` | Unit tests for CLI code generation. |

---

## 💻 3. Verbatim Source Code Implementations

### 3.1 `packages/vite/package.json`
```json
{
  "name": "@arkane/vite",
  "version": "1.0.0",
  "description": "Vite & Rolldown build-time transform plugin for Arkane",
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
    "vite": ">=6.0.0"
  }
}
```

### 3.2 `packages/vite/tsconfig.json`
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

### 3.3 `packages/vite/vitest.config.ts`
```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    name: 'vite',
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
```

### 3.4 `packages/vite/src/plugin.ts`
```ts
import type { Plugin, ResolvedConfig } from 'vite';

export interface ArkanePluginOptions {
  /** Target framework to adapt to. Defaults to 'react' */
  target?: 'react' | 'vue';
  /** Glob pattern for auto-wrapping Svelte components without query params */
  include?: string | RegExp | Array<string | RegExp>;
}

/**
 * Arkane Vite & Rolldown transform plugin.
 * Resolves virtual imports like `import Counter from './Counter.svelte?arkane'`
 * and returns on-the-fly wrapped React 19 or Vue 3.5 component modules.
 */
export function arkane(options: ArkanePluginOptions = {}): Plugin {
  const defaultTarget = options.target ?? 'react';
  let config: ResolvedConfig;

  return {
    name: 'vite-plugin-arkane',
    enforce: 'post', // Executes after @sveltejs/vite-plugin-svelte

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    resolveId(id) {
      if (id.includes('?arkane')) {
        return id;
      }
      return null;
    },

    async transform(code, id) {
      if (!id.includes('?arkane')) return null;

      const isReactTarget =
        id.includes('target=react') ||
        (!id.includes('target=vue') && defaultTarget === 'react');
      const isVueTarget =
        id.includes('target=vue') ||
        (!id.includes('target=react') && defaultTarget === 'vue');

      // Strip query string to retrieve canonical filesystem path
      const cleanPath = id.replace(/\?arkane.*$/, '');

      if (isReactTarget) {
        return {
          code: `
            import { arkane } from '@arkane/react';
            import SvelteComponent from '${cleanPath}';
            export default arkane(SvelteComponent);
            export * from '${cleanPath}';
          `,
          map: null
        };
      }

      if (isVueTarget) {
        return {
          code: `
            import { arkane } from '@arkane/vue';
            import SvelteComponent from '${cleanPath}';
            export default arkane(SvelteComponent);
            export * from '${cleanPath}';
          `,
          map: null
        };
      }

      return null;
    }
  };
}
```

### 3.5 `packages/vite/src/hmr.ts`
```ts
import type { HmrContext } from 'vite';

/**
 * Propagates Svelte component file updates to foreign framework modules.
 */
export function handleArkaneHmr(ctx: HmrContext) {
  if (ctx.file.endsWith('.svelte')) {
    // Invalidate virtual modules dependent on this svelte file
    const affected = Array.from(ctx.server.moduleGraph.idToModuleMap.values()).filter(
      (mod) => mod.id && mod.id.includes(ctx.file) && mod.id.includes('?arkane')
    );

    for (const mod of affected) {
      ctx.server.moduleGraph.invalidateModule(mod);
    }
  }
}
```

### 3.6 `packages/vite/src/index.ts`
```ts
export * from './plugin.ts';
export * from './hmr.ts';
```

---

### 3.7 `packages/cli/package.json`
```json
{
  "name": "@arkane/cli",
  "version": "1.0.0",
  "description": "Static code generation CLI for Arkane universal component adapters",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "bin": {
    "arkane": "./src/bin.ts"
  },
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  },
  "dependencies": {
    "@cliffy/ansi": "jsr:@cliffy/ansi@1.0.0-rc.7",
    "@cliffy/command": "jsr:@cliffy/command@1.0.0-rc.7",
    "@cliffy/table": "jsr:@cliffy/table@1.0.0-rc.7"
  }
}
```

### 3.8 `packages/cli/tsconfig.json`
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

### 3.9 `packages/cli/vitest.config.ts`
```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    name: 'cli',
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
```

### 3.10 `packages/cli/src/scanner.ts`
```ts
import { walk } from 'jsr:@std/fs/walk';
import { basename, resolve } from 'node:path';

export interface SvelteComponentMeta {
  name: string;
  path: string;
  relativePath: string;
}

/**
 * Recursively scans directory for .svelte components.
 */
export async function scanSvelteComponents(dir: string): Promise<SvelteComponentMeta[]> {
  const components: SvelteComponentMeta[] = [];
  const absDir = resolve(dir);

  for await (const entry of walk(absDir, { exts: ['.svelte'], includeDirs: false })) {
    const rawName = basename(entry.path, '.svelte');
    const sanitizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    components.push({
      name: sanitizedName,
      path: entry.path,
      relativePath: entry.path.slice(absDir.length + 1)
    });
  }

  return components.sort((a, b) => a.name.localeCompare(b.name));
}
```

### 3.11 `packages/cli/src/emitter.ts`
```ts
import { ensureDir } from 'jsr:@std/fs/ensure-dir';
import { join, relative } from 'node:path';

export interface EmitOptions {
  componentPath: string;
  componentName: string;
  outputDir: string;
  target: 'react' | 'vue';
}

/**
 * Emits a typed .tsx or .ts adapter file for a given Svelte component.
 */
export async function emitWrapper({
  componentPath,
  componentName,
  outputDir,
  target
}: EmitOptions): Promise<string> {
  await ensureDir(outputDir);
  const relativeImport = relative(outputDir, componentPath).replace(/\\/g, '/');

  if (target === 'react') {
    const filePath = join(outputDir, `${componentName}.tsx`);
    const code = `// Generated by @arkane/cli. Do not edit directly.
import React from 'react';
import { arkane } from '@arkane/react';
import Svelte${componentName} from '${relativeImport}';
import type { ComponentProps } from 'svelte';

export const ${componentName} = arkane(Svelte${componentName});
export type ${componentName}Props = ComponentProps<typeof Svelte${componentName}> & {
  as?: 'span' | 'div' | 'section';
  className?: string;
  ref?: React.Ref<HTMLElement>;
};
export default ${componentName};
`;
    await Deno.writeTextFile(filePath, code);
    return filePath;
  }

  if (target === 'vue') {
    const filePath = join(outputDir, `${componentName}.ts`);
    const code = `// Generated by @arkane/cli. Do not edit directly.
import { arkane } from '@arkane/vue';
import Svelte${componentName} from '${relativeImport}';

export const ${componentName} = arkane(Svelte${componentName});
export default ${componentName};
`;
    await Deno.writeTextFile(filePath, code);
    return filePath;
  }

  throw new Error(`Unsupported target framework: ${target}`);
}
```

### 3.12 `packages/cli/src/bin.ts`
```ts
import { Command } from '@cliffy/command';
import { colors } from '@cliffy/ansi/colors';
import { Table } from '@cliffy/table';
import { scanSvelteComponents } from './scanner.ts';
import { emitWrapper } from './emitter.ts';

await new Command()
  .name('arkane')
  .version('1.0.0')
  .description('⚡ Inscribe Svelte 5 Runes into foreign soil — Universal Adapter CLI')
  .command('generate', 'Generate typed React and Vue component adapters from Svelte 5 files')
  .option('-i, --in <dir:string>', 'Input directory containing .svelte components', { default: './fixtures/components' })
  .option('-o, --out <dir:string>', 'Output directory for generated adapters', { default: './dist/adapters' })
  .option('-t, --target <framework:string>', "Target framework: 'react', 'vue', or 'all'", { default: 'all' })
  .action(async ({ in: inDir, out: outDir, target }) => {
    console.log(colors.bold.cyan('\n⚡ ARKANE: Generating universal conduits...\n'));

    const components = await scanSvelteComponents(inDir);
    const table = new Table().header([colors.bold('Component'), colors.bold('Target'), colors.bold('Status')]);

    for (const comp of components) {
      if (target === 'react' || target === 'all') {
        await emitWrapper({
          componentPath: comp.path,
          componentName: comp.name,
          outputDir: `${outDir}/react`,
          target: 'react'
        });
        table.push([comp.name, colors.blue('React 19'), colors.green('✔ Emitted')]);
      }

      if (target === 'vue' || target === 'all') {
        await emitWrapper({
          componentPath: comp.path,
          componentName: comp.name,
          outputDir: `${outDir}/vue`,
          target: 'vue'
        });
        table.push([comp.name, colors.green('Vue 3.5'), colors.green('✔ Emitted')]);
      }
    }

    table.render();
    console.log(colors.bold.green(`\n✔ Successfully generated adapters for ${components.length} components.\n`));
  })
  .parse(Deno.args);
```

### 3.13 `packages/cli/src/index.ts`
```ts
export * from './scanner.ts';
export * from './emitter.ts';
```

---

## 🧪 4. Complete Test Suite Implementations

### 4.1 `packages/vite/tests/plugin.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { arkane } from '../src/plugin.ts';

describe('@arkane/vite Plugin', () => {
  it('resolves ?arkane query parameters', () => {
    const plugin = arkane({ target: 'react' });
    const resolved = (plugin.resolveId as Function)('/src/Counter.svelte?arkane');
    expect(resolved).toBe('/src/Counter.svelte?arkane');
  });

  it('ignores non-arkane imports', () => {
    const plugin = arkane();
    const resolved = (plugin.resolveId as Function)('/src/Counter.svelte');
    expect(resolved).toBeNull();
  });

  it('transforms React query to @arkane/react adapter module', async () => {
    const plugin = arkane({ target: 'react' });
    const result = await (plugin.transform as Function)(
      '',
      '/workspace/Counter.svelte?arkane'
    );
    expect(result).not.toBeNull();
    expect(result.code).toContain("import { arkane } from '@arkane/react'");
    expect(result.code).toContain("import SvelteComponent from '/workspace/Counter.svelte'");
    expect(result.code).toContain('export default arkane(SvelteComponent)');
  });

  it('transforms Vue query to @arkane/vue adapter module', async () => {
    const plugin = arkane({ target: 'react' });
    const result = await (plugin.transform as Function)(
      '',
      '/workspace/Counter.svelte?arkane&target=vue'
    );
    expect(result).not.toBeNull();
    expect(result.code).toContain("import { arkane } from '@arkane/vue'");
    expect(result.code).toContain('export default arkane(SvelteComponent)');
  });
});
```

### 4.2 `packages/cli/tests/emitter.test.ts`
```ts
import { describe, expect, it, afterAll } from 'vitest';
import { emitWrapper } from '../src/emitter.ts';

const TEST_OUT_DIR = './dist/test-adapters';

describe('@arkane/cli Emitter', () => {
  afterAll(async () => {
    try {
      await Deno.remove(TEST_OUT_DIR, { recursive: true });
    } catch {
      // Ignored
    }
  });

  it('emits a valid React .tsx adapter file', async () => {
    const emittedPath = await emitWrapper({
      componentPath: '/root/components/Counter.svelte',
      componentName: 'Counter',
      outputDir: `${TEST_OUT_DIR}/react`,
      target: 'react'
    });

    const fileContent = await Deno.readTextFile(emittedPath);
    expect(fileContent).toContain("import { arkane } from '@arkane/react'");
    expect(fileContent).toContain('export const Counter = arkane(SvelteCounter)');
    expect(fileContent).toContain('export default Counter');
  });

  it('emits a valid Vue .ts adapter file', async () => {
    const emittedPath = await emitWrapper({
      componentPath: '/root/components/Counter.svelte',
      componentName: 'Counter',
      outputDir: `${TEST_OUT_DIR}/vue`,
      target: 'vue'
    });

    const fileContent = await Deno.readTextFile(emittedPath);
    expect(fileContent).toContain("import { arkane } from '@arkane/vue'");
    expect(fileContent).toContain('export const Counter = arkane(SvelteCounter)');
    expect(fileContent).toContain('export default Counter');
  });
});
```

---

## 🔍 5. Verification Protocol

1. **Vite Plugin Tests:**
   ```bash
   just test vite
   ```
   *Expected Output:* 100% tests passing in `packages/vite/tests/`.
2. **CLI Emitter Tests:**
   ```bash
   just test cli
   ```
   *Expected Output:* 100% tests passing in `packages/cli/tests/`.
3. **CLI End-to-End Generation Run:**
   ```bash
   deno run -A packages/cli/src/bin.ts generate -i ./fixtures/components -o ./dist/adapters -t all
   ```
   *Expected Output:* Generates `dist/adapters/react/Counter.tsx`, `dist/adapters/vue/Counter.ts`, etc., with rendered CLI table.
