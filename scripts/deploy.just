# deploy.just — Convergence CI, packaging, and release

[doc('CI quality gate convergence: format-check + lint-check + audit + types + test')]
[group('ci')]
[positional-arguments]
[script]
ci *flags:
    just _banner "RUNNING ARKANO CI CONVERGENCE GATE"
    print "▶ [Phase 1/6] Biome Formatting Verification..."
    just fmt-check
    print "▶ [Phase 2/6] Biome Lint Verification..."
    just lint-check
    print "▶ [Phase 3/6] Fallow Code Audit..."
    just audit
    print "▶ [Phase 4/6] Multi-Engine Type Matrix..."
    just types
    print "▶ [Phase 5/6] Vitest Test Suite..."
    just test
    print "▶ [Phase 6/6] Packaging Distribution..."
    just build
    print "\n🎉 ALL CI GATES GREEN — CONVERGENCE PASSED."

[doc('Package Arkano distribution via tsdown')]
[group('deploy')]
[positional-arguments]
[script]
build *flags:
    {{ CLI }} compat
    ^deno run -A npm:tsdown --config ./tsdown.config.ts

[doc('Preview build distribution')]
[group('deploy')]
preview: build
    ^deno run -A npm:vite preview

[doc('Build all 3 apps and deploy to GitHub Pages (gh-pages)')]
[group('deploy')]
pages *flags:
    {{ CLI }} pages {{ flags }}

_with-brave +cmd:
    #!/usr/bin/env nu
    let d = (mktemp -d)
    "#!/usr/bin/env nu\ndef main [...args] { exec brave ...$args }" | save -f $"($d)/xdg-open"
    chmod +x $"($d)/xdg-open"
    with-env { PATH: ($env.PATH | prepend $d) } { {{ cmd }} }
    print "✓ {{ cmd }} done"

[doc('Publish build/ to npm')]
[group('deploy')]
publish: build (_with-brave "bun publish")

[doc('npm login')]
[group('deploy')]
login: (_with-brave "bunx npm login")
