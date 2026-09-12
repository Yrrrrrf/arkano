import { transform } from "oxc-transform";
import { compileModule } from "svelte/compiler";
import { defineConfig } from "tsdown";

export default defineConfig({
  cwd: new URL("..", import.meta.url).pathname,
  entry: {
    "core/index": "src/core/src/index.ts",
    "react/index": "src/react/src/index.ts",
    "vue/index": "src/vue/src/index.ts",
    "vite/index": "src/vite/src/index.ts",
    "cli/bin": "src/cli/src/bin.ts",
  },
  format: ["esm", "cjs"],
  fixedExtension: true,
  tsconfig: "./config/tsconfig.json",
  dts: true,
  clean: true,
  platform: "neutral",
  plugins: [{
    name: "arkano-compile-runes",
    transform: {
      filter: { id: /\.svelte\.ts$/ },
      async handler(source, id) {
        const stripped = await transform(id, source, { sourcemap: true });
        if (stripped.errors.length) {
          throw new Error(stripped.errors.map(String).join("\n"));
        }
        return compileModule(stripped.code, {
          filename: id,
          generate: "client",
          dev: false,
        }).js;
      },
    },
  }],
  deps: {
    neverBundle: true,
  },
});
