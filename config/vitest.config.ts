import { defineConfig } from 'vite-plus';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const SRC_ROOT = new URL('../src', import.meta.url).pathname;
const FIXTURES_ROOT = new URL('../fixtures', import.meta.url).pathname;

const sharedAliases = [
  { find: /^@sdk\/ui$/, replacement: `${FIXTURES_ROOT}/components/mod.ts` },
  { find: /^@sdk\/ui\/(.*)/, replacement: `${FIXTURES_ROOT}/components/$1` },
  { find: /^@arkane\/([^/]+)$/, replacement: `${SRC_ROOT}/$1/src/index.ts` },
  { find: /^@arkane\/(.*)/, replacement: `${SRC_ROOT}/$1` },
  { find: /^#fixtures\/(.*)/, replacement: `${FIXTURES_ROOT}/$1` },
];

const jsrShimPlugin = {
  name: 'resolve-jsr-std-fs',
  resolveId(id: string) {
    if (id === 'jsr:@std/fs/ensure-dir' || id === 'jsr:@std/fs/walk') {
      return id;
    }
  },
  load(id: string) {
    if (id === 'jsr:@std/fs/ensure-dir') {
      return `
        import { mkdir } from 'node:fs/promises';
        export async function ensureDir(dir) {
          await mkdir(dir, { recursive: true });
        }
      `;
    }
    if (id === 'jsr:@std/fs/walk') {
      return `
        import { readdir } from 'node:fs/promises';
        import { join } from 'node:path';
        export async function* walk(dir, options = {}) {
          const entries = await readdir(dir, { withFileTypes: true, recursive: true });
          for (const entry of entries) {
            const fullPath = join(entry.parentPath || dir, entry.name);
            if (entry.isFile() && (!options.exts || options.exts.some(ext => entry.name.endsWith(ext)))) {
              yield { path: fullPath, name: entry.name, isFile: true, isDirectory: false, isSymlink: false };
            }
          }
        }
      `;
    }
  },
};

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/src/**/*.ts', 'src/**/src/**/*.svelte.ts'],
    },
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.jj/**',
      '**/dist/**',
      '**/build/**',
    ],
    projects: [
      {
        test: {
          name: 'core',
          globals: true,
          environment: 'node',
          include: ['src/core/tests/**/*.test.ts'],
        },
        resolve: { alias: sharedAliases },
        plugins: [svelte({ compilerOptions: { runes: true } })],
      },
      {
        test: {
          name: 'react',
          globals: true,
          environment: 'jsdom',
          include: ['src/react/tests/**/*.test.tsx', 'src/react/tests/**/*.test.ts'],
        },
        resolve: {
          alias: sharedAliases,
          conditions: ['browser'],
        },
        plugins: [react(), svelte({ compilerOptions: { runes: true } })],
      },
      {
        test: {
          name: 'vue',
          globals: true,
          environment: 'jsdom',
          include: ['src/vue/tests/**/*.test.ts'],
        },
        resolve: {
          alias: sharedAliases,
          conditions: ['browser'],
        },
        plugins: [vue(), svelte({ compilerOptions: { runes: true } })],
      },
      {
        test: {
          name: 'vite',
          globals: true,
          environment: 'node',
          include: ['src/vite/tests/**/*.test.ts'],
        },
        resolve: { alias: sharedAliases },
      },
      {
        test: {
          name: 'cli',
          globals: true,
          environment: 'node',
          include: ['src/cli/tests/**/*.test.ts'],
        },
        resolve: { alias: sharedAliases },
        plugins: [jsrShimPlugin],
      },
      {
        test: {
          name: 'showcase',
          globals: true,
          environment: 'jsdom',
          include: ['fixtures/showcase.test.tsx', 'fixtures/**/*.test.tsx', 'fixtures/**/*.test.ts'],
        },
        resolve: {
          alias: sharedAliases,
          conditions: ['browser'],
        },
        plugins: [react(), vue(), svelte({ compilerOptions: { runes: true } })],
      },
      './apps/*/vite.config.*',
    ],
  },
});
