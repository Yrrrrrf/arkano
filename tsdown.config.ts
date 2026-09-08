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
