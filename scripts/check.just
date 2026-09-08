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
    ^deno run -A npm:fallow dead-code -c config/fallowrc.json

[doc('Check code health score via Fallow')]
[group('check')]
health:
    ^deno run -A npm:fallow health --score -c config/fallowrc.json

[doc('Type-check Deno & core TypeScript modules')]
[group('check')]
types-core:
    ^deno check src/core/src/index.ts src/vite/src/index.ts src/cli/src/bin.ts

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
