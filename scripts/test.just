# test.just — Vitest suite execution

[doc('Run unit and integration test suite via Vitest')]
[group('test')]
[script]
test filter='':
    let args = if ("{{filter}}" in ["core", "react", "vue", "vite", "cli", "showcase"]) {
        ["--project", "{{filter}}"]
    } else if ("{{filter}}" | is-not-empty) {
        ["{{filter}}"]
    } else {
        []
    }
    ^deno run -A npm:vitest run --config ./config/vitest.config.ts ...$args

[doc('Run test suite with code coverage')]
[group('test')]
coverage:
    ^deno run -A npm:vitest run --coverage --config ./config/vitest.config.ts
