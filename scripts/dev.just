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
        "package.json"
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

[doc('Run an app on the dev server (pass -A to run all apps concurrently)')]
[group('dev')]
[positional-arguments]
dev *flags:
    {{ CLI }} dev {{ flags }}

alias run := dev


