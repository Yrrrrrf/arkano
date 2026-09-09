# justfile — Arkano Root Harness
# Universal Svelte 5 Runes Conduit for React 19 & Vue 3.5

set shell := ["nu", "-c"]
set script-interpreter := ["nu"]

import 'scripts/_shared.just'
import 'scripts/dev.just'
import 'scripts/check.just'
import 'scripts/test.just'
import 'scripts/deploy.just'
