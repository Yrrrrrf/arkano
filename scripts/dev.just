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
    ^deno install --entrypoint npm:svelte-check-native npm:@typescript/native-preview npm:typescript@6
    {{ CLI }} compat

[doc('Run an app on the dev server (pass -A to run all apps concurrently)')]
[group('dev')]
[positional-arguments]
dev *flags:
    {{ CLI }} dev {{ flags }}

alias run := dev


