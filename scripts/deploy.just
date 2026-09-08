# deploy.just — Convergence CI, packaging, and release

[doc('CI quality gate convergence: format-check + lint-check + audit + types + test')]
[group('ci')]
[script]
ci:
    _banner "RUNNING ARKANE CI CONVERGENCE GATE"
    print "▶ [Phase 1/5] Biome Formatting Verification..."
    just fmt-check
    print "▶ [Phase 2/5] Biome Lint Verification..."
    just lint-check
    print "▶ [Phase 3/5] Fallow Code Audit..."
    just audit
    print "▶ [Phase 4/5] Multi-Engine Type Matrix..."
    just types
    print "▶ [Phase 5/5] Vitest Test Suite..."
    just test
    print "\n🎉 ALL CI GATES GREEN — CONVERGENCE PASSED."

[doc('Package Arkane distribution via tsdown')]
[group('deploy')]
build:
    ^deno run -A npm:tsdown --config ./tsdown.config.ts

[doc('Preview build distribution')]
[group('deploy')]
preview: build
    ^deno run -A npm:vite preview

[doc('Publish Arkane release (gated by CI and clean tree)')]
[group('deploy')]
[confirm("Ship release to production?")]
publish: _clean-tree ci build
    _banner "shipping {{PROJECT}} {{VERSION}}"
    @print "Published {{PROJECT}} {{VERSION}} successfully"
