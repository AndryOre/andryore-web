#!/usr/bin/env bash
# Builds the nginx image from the repo root, runs it and checks status codes,
# the /es/ routes, both 404 pages, the security headers, gzip and the sitemap.
# Not part of `bun run check`: run it with `bun run test:smoke` or from CI.
# Set SMOKE_COPY_DIST=<dir> to copy the image's static output out for the dist
# audit. Set SMOKE_BASE_URL=<url> to run the checks against a server that is
# already up, without Docker.
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
image="andryore-site-smoke"
name="andryore-site-smoke-$$"

if [ -n "${SMOKE_BASE_URL:-}" ]; then
  base="$SMOKE_BASE_URL"
else
  docker build --build-arg SITE_LASTMOD="$(date -u +%F)" -t "$image" "$root"
  docker run -d --rm --name "$name" -p 127.0.0.1:0:80 "$image" >/dev/null
  trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT
  port="$(docker port "$name" 80/tcp | head -n1 | sed 's/.*://')"
  base="http://127.0.0.1:$port"
fi

for _ in $(seq 1 30); do
  curl -fs -o /dev/null "$base/" && break
  sleep 0.5
done

fail() { echo "FAIL: $*" >&2; exit 1; }
status() { curl -s -o /dev/null -w '%{http_code}' "$1"; }

for route in / /about/ /uses/ /products/snug/ \
  /es/ /es/about/ /es/uses/ /es/products/snug/ \
  /sitemap.xml /robots.txt; do
  [ "$(status "$base$route")" = 200 ] || fail "$route is not 200"
done

for legacy in colophon:/uses#this-site es/colophon:/es/uses#this-site; do
  legacy_headers="$(curl -s -o /dev/null -D - "$base/${legacy%%:*}" | tr -d '\r')"
  grep -qi '^HTTP/[0-9.]* 301' <<<"$legacy_headers" ||
    fail "/${legacy%%:*} is not a 301"
  grep -qi "^location: ${legacy#*:}\$" <<<"$legacy_headers" ||
    fail "/${legacy%%:*} does not redirect to ${legacy#*:}"
done

[ "$(status "$base/nope/")" = 404 ] || fail "missing page is not 404"
[ "$(status "$base/es/nope/")" = 404 ] || fail "missing /es/ page is not 404"
www_headers="$(curl -s -o /dev/null -D - -H 'Host: www.andryore.dev' "$base/es/?a=1" | tr -d '\r')"
grep -qi '^HTTP/[0-9.]* 301' <<<"$www_headers" || fail "www is not a 301"
grep -qi '^location: https://andryore.dev/es/?a=1$' <<<"$www_headers" ||
  fail "www does not redirect to the apex"
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
origins="$(grep -Eo 'https?://[^ ;]+' <<<"$csp" | sort | tr '\n' ' ')"
[ "$origins" = "https://cloud.umami.is https://gateway.umami.is " ] ||
  fail "CSP names an origin other than the two Umami hosts (ADR 0014): $origins"
grep -q "script-src 'self' https://cloud.umami.is 'sha256-" <<<"$csp" ||
  fail "Umami is not the only extra script-src origin"
grep -q "connect-src 'self' https://gateway.umami.is;" <<<"$csp" ||
  fail "Umami gateway is not the only extra connect-src origin"
grep -q "manifest-src 'self';" <<<"$csp" ||
  fail "CSP is missing manifest-src 'self'"
case "$csp" in *"'unsafe-inline'"* | *"'unsafe-eval'"*) fail "CSP allows unsafe-inline or unsafe-eval" ;; esac
grep -q "'sha256-" <<<"$csp" ||
  fail "CSP script-src has no sha256 hashes: inline scripts are blocked (ADR 0012)"
for directive in "default-src 'none'" "base-uri 'none'" "form-action 'none'" \
  "frame-ancestors 'none'" "require-trusted-types-for 'script'"; do
  grep -qF "$directive" <<<"$csp" || fail "CSP is missing $directive"
done

sitemap="$(curl -s "$base/sitemap.xml")"
urls="$(grep -c '<url>' <<<"$sitemap" || true)"
lastmods="$(grep -c '<lastmod>' <<<"$sitemap" || true)"
[ "$urls" -gt 0 ] || fail "sitemap has no urls"
[ "$urls" = "$lastmods" ] || fail "sitemap: $lastmods lastmod for $urls urls"

if [ -n "${SMOKE_COPY_DIST:-}" ] && [ -z "${SMOKE_BASE_URL:-}" ]; then
  rm -rf "$SMOKE_COPY_DIST"
  mkdir -p "$SMOKE_COPY_DIST"
  docker cp "$name:/usr/share/nginx/html/." "$SMOKE_COPY_DIST"
fi

echo "smoke passed"
