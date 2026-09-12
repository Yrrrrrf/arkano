import { svelte } from "@sveltejs/vite-plugin-svelte";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite-plus";

const SRC_ROOT = new URL("../src", import.meta.url).pathname;
const FIXTURES_ROOT = new URL("../fixtures", import.meta.url).pathname;

const sharedAliases = [
	{ find: /^arkano$/, replacement: `${SRC_ROOT}/core/src/index.ts` },
	{ find: /^arkano\/(react|vue|vite)$/, replacement: `${SRC_ROOT}/$1/src/index.ts` },
	{ find: /^@sdk\/ui$/, replacement: `${FIXTURES_ROOT}/components/mod.ts` },
	{ find: /^@sdk\/ui\/(.*)/, replacement: `${FIXTURES_ROOT}/components/$1` },
	{ find: /^@arkano\/([^/]+)$/, replacement: `${SRC_ROOT}/$1/src/index.ts` },
	{ find: /^@arkano\/(.*)/, replacement: `${SRC_ROOT}/$1` },
	{ find: /^#fixtures\/(.*)/, replacement: `${FIXTURES_ROOT}/$1` },
];

const jsrShimPlugin = {
	name: "resolve-jsr-std-fs",
	resolveId(id: string) {
		if (
			id === "jsr:@std/fs/ensure-dir" ||
			id === "jsr:@std/fs/walk" ||
			id === "@std/fs/ensure-dir" ||
			id === "@std/fs/walk" ||
			id === "@std/fs" ||
			id === "jsr:@std/path" ||
			id === "@std/path" ||
			id === "@std/path/posix" ||
			id === "jsr:@std/path/posix"
		) {
			return id;
		}
	},
	load(id: string) {
		if (
			id === "jsr:@std/path" ||
			id === "@std/path" ||
			id === "@std/path/posix" ||
			id === "jsr:@std/path/posix"
		) {
			return `
        function normalize(path) {
          const isAbs = path.startsWith('/');
          const parts = path.split(/[\\\\/]+/).filter(Boolean);
          const up = [];
          for (const part of parts) {
            if (part === '.') continue;
            if (part === '..') {
              if (up.length > 0 && up[up.length - 1] !== '..') {
                up.pop();
              } else if (!isAbs) {
                up.push('..');
              }
            } else {
              up.push(part);
            }
          }
          return (isAbs ? '/' : '') + up.join('/');
        }
        export function join(...paths) {
          return normalize(paths.filter(Boolean).join('/'));
        }
        export function basename(path, ext = '') {
          const parts = path.split(/[\\\\/]+/).filter(Boolean);
          const last = parts.length > 0 ? parts[parts.length - 1] : '';
          if (ext && last.endsWith(ext)) {
            return last.slice(0, -ext.length);
          }
          return last;
        }
        export function resolve(...paths) {
          let resolvedPath = '';
          let resolvedAbsolute = false;
          for (let i = paths.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            const path = i >= 0 ? paths[i] : (typeof process !== 'undefined' && process.cwd ? process.cwd() : '/');
            if (!path) continue;
            resolvedPath = resolvedPath ? \`\${path}/\${resolvedPath}\` : path;
            resolvedAbsolute = path.startsWith('/');
          }
          return normalize(resolvedPath) || '.';
        }
        export function relative(from, to) {
          const fromAbs = resolve(from);
          const toAbs = resolve(to);
          if (fromAbs === toAbs) return '';
          const fromParts = fromAbs.split('/').filter(Boolean);
          const toParts = toAbs.split('/').filter(Boolean);
          let samePartsLength = 0;
          while (samePartsLength < fromParts.length && samePartsLength < toParts.length && fromParts[samePartsLength] === toParts[samePartsLength]) {
            samePartsLength++;
          }
          const upCount = fromParts.length - samePartsLength;
          const upParts = Array(upCount).fill('..');
          const downParts = toParts.slice(samePartsLength);
          return [...upParts, ...downParts].join('/') || '.';
        }
      `;
		}
		if (id === "jsr:@std/fs/ensure-dir" || id === "@std/fs/ensure-dir") {
			return `
        export async function ensureDir(dir) {
          if (typeof Deno !== 'undefined' && Deno.mkdir) {
            await Deno.mkdir(dir, { recursive: true });
          }
        }
      `;
		}
		if (id === "jsr:@std/fs/walk" || id === "@std/fs/walk") {
			return `
        export async function* walk(dir, options = {}) {
          if (typeof Deno !== 'undefined' && Deno.readDir) {
            for await (const entry of Deno.readDir(dir)) {
              const fullPath = dir.endsWith('/') ? \`\${dir}\${entry.name}\` : \`\${dir}/\${entry.name}\`;
              if (entry.isDirectory) {
                yield* walk(fullPath, options);
              } else if (entry.isFile && (!options.exts || options.exts.some(ext => entry.name.endsWith(ext)))) {
                yield { path: fullPath, name: entry.name, isFile: true, isDirectory: false, isSymlink: false };
              }
            }
          }
        }
      `;
		}
		if (id === "@std/fs") {
			return `
        export async function ensureDir(dir) {
          if (typeof Deno !== 'undefined' && Deno.mkdir) {
            await Deno.mkdir(dir, { recursive: true });
          }
        }
        export function existsSync(path) {
          if (typeof Deno !== 'undefined' && Deno.statSync) {
            try {
              Deno.statSync(path);
              return true;
            } catch {
              return false;
            }
          }
          return false;
        }
        export async function* walk(dir, options = {}) {
          if (typeof Deno !== 'undefined' && Deno.readDir) {
            for await (const entry of Deno.readDir(dir)) {
              const fullPath = dir.endsWith('/') ? \`\${dir}\${entry.name}\` : \`\${dir}/\${entry.name}\`;
              if (entry.isDirectory) {
                yield* walk(fullPath, options);
              } else if (entry.isFile && (!options.exts || options.exts.some(ext => entry.name.endsWith(ext)))) {
                yield { path: fullPath, name: entry.name, isFile: true, isDirectory: false, isSymlink: false };
              }
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
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/src/**/*.ts", "src/**/src/**/*.svelte.ts"],
		},
		exclude: [
			"**/node_modules/**",
			"**/.git/**",
			"**/.jj/**",
			"**/dist/**",
			"**/build/**",
		],
		projects: [
			{
				test: {
					name: "core",
					globals: true,
					environment: "node",
					include: ["src/core/tests/**/*.test.ts"],
				},
				resolve: { alias: sharedAliases },
				plugins: [svelte({ compilerOptions: { runes: true } })],
			},
			{
				test: {
					name: "react",
					globals: true,
					environment: "jsdom",
					include: [
						"src/react/tests/**/*.test.tsx",
						"src/react/tests/**/*.test.ts",
					],
				},
				resolve: {
					alias: sharedAliases,
					conditions: ["browser"],
				},
				plugins: [react(), svelte({ compilerOptions: { runes: true } })],
			},
			{
				test: {
					name: "vue",
					globals: true,
					environment: "jsdom",
					include: ["src/vue/tests/**/*.test.ts"],
				},
				resolve: {
					alias: sharedAliases,
					conditions: ["browser"],
				},
				plugins: [vue(), svelte({ compilerOptions: { runes: true } })],
			},
			{
				test: {
					name: "vite",
					globals: true,
					environment: "node",
					include: ["src/vite/tests/**/*.test.ts"],
				},
				resolve: { alias: sharedAliases },
			},
			{
				test: {
					name: "cli",
					globals: true,
					environment: "node",
					include: ["src/cli/tests/**/*.test.ts"],
				},
				resolve: { alias: sharedAliases },
				plugins: [jsrShimPlugin],
			},
			{
				test: {
					name: "showcase",
					globals: true,
					environment: "jsdom",
					include: [
						"fixtures/showcase.test.tsx",
						"fixtures/**/*.test.tsx",
						"fixtures/**/*.test.ts",
					],
				},
				resolve: {
					alias: sharedAliases,
					conditions: ["browser"],
				},
				plugins: [react(), vue(), svelte({ compilerOptions: { runes: true } })],
			},
			"./apps/*/vite.config.*",
		],
	},
});
