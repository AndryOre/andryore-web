# 0005: TSDoc-only code comments

## Status

Accepted

Date: 2026-10-16

Revised: 2026-10-19, removed the vendored-code exemption, which the lint config
never applied.

## Context

Andry's other repos (Animated Fluent Emojis, Snug) enforce one comment policy by
lint. Without enforcement, comments drift out of sync with the code they
describe and mix styles. No core ESLint rule bans non-doc comments, so the
policy needs a local rule to hold.

## Decision

- **TSDoc only.** Every code comment is a `/**` block on a non-obvious export.
  `//` line comments and non-JSDoc `/* */` blocks are disallowed.
- **Directive comments are the only exception** (`eslint-disable`, `@ts-`,
  `prettier-ignore`, triple-slash references), and an `eslint-disable` must
  carry a description.
- **It is enforced by lint**: a local `no-non-doc-comments` ESLint rule, copied
  from Animated Fluent Emojis with its tests, plus `eslint-plugin-jsdoc`'s
  `informative-docs`.

### Rejected alternatives

- **An unenforced "write good comments" policy**: drifts back within a few PRs.
- **`require-jsdoc` on every export**: produces noise on self-explanatory code.

## Consequences

- Rationale that would have been a `//` comment lives in a TSDoc block on the
  declaration it explains.
- The rule and its `bun test` suite are part of the lint ticket's scope.
