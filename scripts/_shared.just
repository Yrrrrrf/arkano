# _shared.just — Front door, variables, and VCS hygiene

PROJECT := "arkano"
VERSION := `let res = (do { ^git describe --tags --always --dirty } | complete); if $res.exit_code == 0 { $res.stdout | str trim } else { "1.0.0-dev" }`
CLIENT_DIR := parent_directory(source_directory())
CLI := "deno run -A " + CLIENT_DIR / "scripts/cli/main.ts"

[default]
[doc('List all available recipes in grouped format')]
[group('meta')]
list:
    @just --list --unsorted

[doc('Interactive recipe autocomplete menu via gum')]
[group('meta')]
[script]
menu:
    let recipes = (just --summary | str trim | split row ' ')
    if (which gum | is-not-empty) {
        let choice = ($recipes | str join "\n" | ^gum filter --placeholder ($"($PROJECT) recipe...")) | str trim
        if ($choice | is-not-empty) { just $choice }
    } else {
        just list
    }

[private]
[group('meta')]
[script]
_banner msg:
    if (which gum | is-not-empty) {
        ^gum style --foreground 212 --border rounded --padding "0 2" "{{msg}}"
    } else {
        print $"\n===> {{msg}}\n"
    }

[private]
[group('meta')]
[script]
_clean-tree:
    let has_jj = (".jj" | path exists) or ((do { ^jj root } | complete).exit_code == 0)
    let has_git = (".git" | path exists) or ((do { ^git rev-parse --is-inside-work-tree } | complete).exit_code == 0)

    if not $has_jj and not $has_git {
        print "Notice: No VCS repository (.jj or .git) detected. Skipping tree cleanliness check."
        return
    }

    if $has_jj {
        print "Checking Jujutsu (jj) hygiene..."
        let conflicts = (do { ^jj log -r 'conflicts()' --no-graph -T 'change_id ++ "\n"' --ignore-working-copy --color=never } | complete)
        if $conflicts.exit_code == 0 and ($conflicts.stdout | str trim | is-not-empty) {
            error make { msg: $"Jujutsu conflicts detected in revisions:\n($conflicts.stdout)" }
        }

        let divergent = (do { ^jj log -r 'divergent()' --no-graph -T 'change_id ++ "\n"' --ignore-working-copy --color=never } | complete)
        if $divergent.exit_code == 0 and ($divergent.stdout | str trim | is-not-empty) {
            error make { msg: $"Jujutsu divergent revisions detected:\n($divergent.stdout)" }
        }

        let diff = (do { ^jj diff -r @ --color=never } | complete)
        if $diff.exit_code == 0 and ($diff.stdout | str trim | is-not-empty) {
            error make { msg: "Jujutsu working copy (@) has uncommitted changes. Run 'jj new' or 'jj squash' before releasing." }
        }
    }

    if $has_git {
        print "Checking Git hygiene..."
        let status = (do { ^git status --porcelain=v1 } | complete)
        if $status.exit_code == 0 and ($status.stdout | str trim | is-not-empty) {
            error make { msg: $"Git working tree is dirty:\n($status.stdout)" }
        }
    }

    print "✓ VCS hygiene verified: working tree clean and conflict-free."
