# 0013: AI crawler policy

## Status

Accepted. Extends [0002](0002-bilingual-parity.md).

Date: 2026-10-17

## Context

The Site should be findable and citable in search and in AI answers, which is
the point of the `ai-seo` skill and of `llms.txt`. It should not be used as
training data without a decision to allow it. Snug's `robots.txt` already splits
the two groups; AFE has no such policy.

## Decision

- **`robots.txt` allows search and answer crawlers**: `Googlebot`, `Bingbot`,
  `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`,
  `PerplexityBot` and `Perplexity-User`.
- **`robots.txt` disallows model-training crawlers** in their own group:
  `GPTBot`, `ClaudeBot`, `CCBot`, `Applebot-Extended` and `Bytespider`.
- **`Google-Extended` is not listed.** Blocking it also removes Gemini grounding
  and does not affect Search.
- **Everything else is allowed**, and the file points at the sitemap.
- **The lists live in one typed module with a test**, so adding a crawler is a
  one-line change that the test pins.

### Rejected alternatives

- **Allow every bot**: also invites training use with no decision behind it.
- **Block every AI bot**: conflicts with being cited in AI answers.

## Consequences

- `robots.txt` is generated, not hand-written (AO-1966).
- `robots.txt` is a request, not enforcement; a crawler that ignores it is
  outside this policy.
- Revisit the lists when a major vendor adds or renames a user agent.
