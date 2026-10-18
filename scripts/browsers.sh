#!/usr/bin/env bash
# Runs the layout specs in WebKit and Firefox inside the pinned Playwright
# image, which ships both browsers with their system libraries. The image tag
# is read from bun.lock, and the repo is mounted so it needs a prior
# `bun install` and `bun run build`.
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
version="$(sed -n 's/.*"playwright": \["playwright@\([0-9.]*\)".*/\1/p' "$root/bun.lock" | head -n1)"
if [ -z "$version" ]; then
  echo "FAIL: playwright version not found in bun.lock" >&2
  exit 1
fi
image="mcr.microsoft.com/playwright:v${version}-noble"

docker run --rm --init --ipc=host \
  -e CI=1 -e PLAYWRIGHT_PREVIEW_COMMAND="npx astro preview" \
  -v "$root:/work" -w /work \
  "$image" \
  bash -c "npx playwright test --project=webkit --project=firefox; status=\$?; chown -R $(id -u):$(id -g) test-results playwright-report 2>/dev/null; exit \$status"
