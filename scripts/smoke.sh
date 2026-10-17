#!/usr/bin/env bash
# Builds the nginx image from the repo root, runs it and checks status codes,
# the /es/ routes, both 404 pages, the security headers, gzip and the sitemap.
# Not part of `bun run check`: run it with `bun run test:smoke` or from CI.
# Set SMOKE_COPY_DIST=<dir> to copy the image's static output out for the dist
# audit. Set SMOKE_REQUIRE_CSP_HASHES=1 to turn the missing-hash warning into
# a failure.
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
image="andryore-site-smoke"
name="andryore-site-smoke-$$"

docker build --build-arg SITE_LASTMOD="$(date -u +%F)" -t "$image" "$root"
docker run -d --rm --name "$name" -p 127.0.0.1:0:80 "$image" >/dev/null
trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT
port="$(docker port "$name" 80/tcp | head -n1 | sed 's/.*://')"
base="http://127.0.0.1:$port"

for _ in $(seq 1 30); do
  curl -fs -o /dev/null "$base/" && break
  sleep 0.5
done

fail() { echo "FAIL: $*" >&2; exit 1; }
status() { curl -s -o /dev/null -w '%{http_code}' "$1"; }

for route in / /about/ /colophon/ /uses/ /log/ /products/snug/ \
  /es/ /es/about/ /es/colophon/ /es/uses/ /es/log/ /es/products/snug/ \
  /sitemap.xml /robots.txt; do
  [ "$(status "$base$route")" = 200 ] || fail "$route is not 200"
done

[ "$(status "$base/nope/")" = 404 ] || fail "missing page is not 404"
[ "$(status "$base/es/nope/")" = 404 ] || fail "missing /es/ page is not 404"
grep -q '<html lang="en"' <<<"$(curl -s "$base/nope/")" ||
  fail "root 404 is not English"
grep -q '<html lang="es"' <<<"$(curl -s "$base/es/nope/")" ||
  fail "/es/ 404 is not Spanish"

headers="$(curl -s -o /dev/null -D - -H 'Accept-Encoding: gzip' "$base/" | tr -d '\r')"
for header in content-security-policy x-content-type-options referrer-policy \
  permissions-policy x-frame-options cross-origin-opener-policy \
  cross-origin-resource-policy strict-transport-security; do
  grep -qi "^$header:" <<<"$headers" || fail "missing $header"
done
grep -qi '^content-encoding: gzip' <<<"$headers" || fail "html is not gzipped"
grep -qi '^content-type: text/html; charset=utf-8' <<<"$headers" ||
  fail "html has no utf-8 charset"

csp="$(grep -i '^content-security-policy:' <<<"$headers")"
if grep -Eq 'https?://' <<<"$csp"; then
  fail "CSP names a third-party origin"
fi
case "$csp" in *"'unsafe-inline'"* | *"'unsafe-eval'"*) fail "CSP allows unsafe-inline or unsafe-eval" ;; esac
if ! grep -q "'sha256-" <<<"$csp"; then
  message="CSP has no sha256 hashes: inline scripts are blocked (ADR 0012)"
  if [ "${SMOKE_REQUIRE_CSP_HASHES:-0}" = 1 ]; then fail "$message"; fi
  echo "WARN: $message" >&2
fi

sitemap="$(curl -s "$base/sitemap.xml")"
urls="$(grep -c '<url>' <<<"$sitemap" || true)"
lastmods="$(grep -c '<lastmod>' <<<"$sitemap" || true)"
[ "$urls" -gt 0 ] || fail "sitemap has no urls"
[ "$urls" = "$lastmods" ] || fail "sitemap: $lastmods lastmod for $urls urls"

if [ -n "${SMOKE_COPY_DIST:-}" ]; then
  rm -rf "$SMOKE_COPY_DIST"
  mkdir -p "$SMOKE_COPY_DIST"
  docker cp "$name:/usr/share/nginx/html/." "$SMOKE_COPY_DIST"
fi

echo "smoke passed"
