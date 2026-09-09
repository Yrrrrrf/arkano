import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption, type UserConfig } from 'vite-plus';

const SRC_ROOT = new URL('../src', import.meta.url).pathname;
const FIXTURES_ROOT = new URL('../fixtures', import.meta.url).pathname;

export interface GwaConfig {
  plugins?: PluginOption[];
  extraPlugins?: PluginOption[];
  overrides?: UserConfig;
}

export function defineGWA(options: GwaConfig = {}) {
  const { plugins = [], extraPlugins = [], overrides = {} } = options;

  return defineConfig({
    resolve: {
      alias: [
        { find: /^@sdk\/ui$/, replacement: `${FIXTURES_ROOT}/components/mod.ts` },
        { find: /^@sdk\/ui\/(.*)/, replacement: `${FIXTURES_ROOT}/components/$1` },
        { find: /^@arkane\/([^/]+)$/, replacement: `${SRC_ROOT}/$1/src/index.ts` },
        { find: /^@arkane\/(.*)/, replacement: `${SRC_ROOT}/$1` },
        { find: /^#fixtures\/(.*)/, replacement: `${FIXTURES_ROOT}/$1` },
        { find: /^#lib\/(.*)/, replacement: '/src/lib/$1' },
        { find: /^#lib$/, replacement: '/src/lib/mod.ts' },
      ],
    },
    plugins: [tailwindcss() as PluginOption, ...plugins, ...extraPlugins],
    ssr: {
      noExternal: ['rune-lab'],
    },
    ...overrides,
  });
}

export const defineArkaneApp = defineGWA;
export default defineGWA();
export type { PluginOption };
