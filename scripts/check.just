# check.just — Formatters, linters, code auditors, and type gates

[doc('Format workspace using Biome (in-place fix)')]
[group('check')]
fmt:
    ^deno run -A npm:@biomejs/biome format --config-path=config/biome.json --write .

[doc('Lint workspace using Biome (in-place fix)')]
[group('check')]
lint:
    ^deno run -A npm:@biomejs/biome lint --config-path=config/biome.json --write .

[doc('Audit code namespaces for unused exports and dead code (Fallow)')]
[group('check')]
audit:
    ^deno run -A npm:fallow dead-code -c config/fallowrc.json

[doc('Check code health score via Fallow')]
[group('check')]
health:
    ^deno run -A npm:fallow health --score -c config/fallowrc.json

[doc('Execute complete multi-engine type checking matrix')]
[group('check')]
[script]
types:
    print "▶ [1/4] Checking Core TypeScript modules (deno check)..."
    ^deno check src/core/src/index.ts src/vite/src/index.ts src/cli/src/bin.ts

    print "▶ [2/4] Checking Svelte 5 Runes (svelte-check)..."
    ^deno install --entrypoint npm:svelte-check-native npm:@typescript/native-preview npm:typescript@6
    {{ CLI }} compat
    ^deno run -A npm:svelte-check-native --tsconfig ./config/tsconfig.json --threshold error

    print "▶ [3/4] Checking React 19 definitions (tsc)..."
    ^deno run -A npm:typescript@6/tsc -p ./config/tsconfig.json --noEmit

    print "▶ [4/4] Checking Vue 3.5 definitions (vue-tsc)..."
    ^deno install --entrypoint npm:vue-tsc@3.3.11 npm:typescript@6
    ^deno run -A npm:vue-tsc -p ./config/tsconfig.json --noEmit

    print "✓ Multi-engine type checking matrix passed."

[doc('Run all check quality gates (fmt, lint, audit, types)')]
[group('check')]
check: fmt lint audit types
