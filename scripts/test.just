# test.just — Vitest suite execution

[doc('Run unit and integration test suite via Vitest')]
[group('test')]
[arg('filter', short='f', long='filter', help='Filter test files by pattern')]
test filter='':
    ^deno run -A npm:vitest run --config ./config/vitest.config.ts {{ if filter != "" { filter } else { "" } }}

[doc('Run test suite with code coverage')]
[group('test')]
coverage:
    ^deno run -A npm:vitest run --coverage --config ./config/vitest.config.ts
