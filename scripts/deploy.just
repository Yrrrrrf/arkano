# deploy.just — Convergence CI, packaging, and release

[doc('CI quality gate convergence: format-check + lint-check + audit + types + test')]
[group('ci')]
[positional-arguments]
[script]
ci *flags:
    just _banner "RUNNING ARKANE CI CONVERGENCE GATE"
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

[doc('Package Arkane distribution via tsdown')]
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

[doc('Publish Arkane release (gated by CI and clean tree)')]
[group('deploy')]
[confirm("Ship release to production?")]
publish: _clean-tree ci build
    just _banner "shipping {{PROJECT}} {{VERSION}}"
    @print "Published {{PROJECT}} {{VERSION}} successfully"
