#!/usr/bin/env bash
# Runs the visual snapshot spec inside the pinned Playwright image so the
# pixels are the same on every machine. The image tag is read from bun.lock,
# and the repo is mounted so it needs a prior `bun install` and `bun run build`.
# Pass --update to regenerate the committed snapshots.
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
version="$(sed -n 's/.*"playwright": \["playwright@\([0-9.]*\)".*/\1/p' "$root/bun.lock" | head -n1)"
if [ -z "$version" ]; then
  echo "FAIL: playwright version not found in bun.lock" >&2
  exit 1
fi
image="mcr.microsoft.com/playwright:v${version}-noble"

flags="--config playwright.visual.config.ts"
if [ "${1:-}" = "--update" ]; then flags="$flags --update-snapshots"; fi

docker run --rm --init --ipc=host \
  -e CI=1 -e PLAYWRIGHT_PREVIEW_COMMAND="npx astro preview" \
  -v "$root:/work" -w /work \
  "$image" \
  bash -c "npx playwright test $flags; status=\$?; chown -R $(id -u):$(id -g) e2e/__snapshots__ test-results 2>/dev/null; exit \$status"
