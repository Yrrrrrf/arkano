# dev.just — Developer loop & maintenance

[doc('Prune node_modules, build artifacts, and caches')]
[group('dev')]
[script]
prune:
    let targets = [
        "node_modules"
        ".svelte-kit"
        ".vite"
        "dist"
        "build"
        "coverage"
        ".justcache"
    ]
    for target in $targets {
        if ($target | path exists) {
            rm -r -f $target
            print $"pruned: ($target)"
        }
    }
    print "✓ Workspace caches pruned."

[doc('Clean and reinstall workspace dependencies')]
[group('dev')]
prepare: prune
    ^deno install
    ^deno install --entrypoint npm:vue-tsc npm:typescript@6

[doc('Start playground dev server')]
[group('dev')]
dev:
    ^deno run -A npm:vite
