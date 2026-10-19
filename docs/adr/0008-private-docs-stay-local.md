# 0008: Private docs stay local

## Status

Accepted. Partly supersedes [0001](0001-brand-kit-in-docs-brand.md): the
research no longer lives in `docs/brand`.

Date: 2026-10-16

Revised: 2026-10-19, recorded the partial supersession of 0001.

## Context

The repository becomes public so that CodeQL, Scorecard and rulesets work. It
also held brand research, process notes, copy drafts, exploration boards, web
inspiration and design canvases that are working material, not part of the
product.

## Decision

- **These paths stay on disk and are gitignored:** `docs/web/`, `docs/design/`,
  and under `docs/brand/`: `CONTEXT.md`, `research.md`, `research-notes/`,
  `process.md`, `brief.md`, `competitors.md`, `copy.md`, `voice.md`,
  `naming.md`, `apply-spec.md`, `explorations/`, `social/` and
  `brandbook/index.html`.
- **The public kit stays tracked:** `tokens.css`, `logo/`, `og/`, `avatar/`,
  `brandbook/fonts.css`, `brandbook/fonts/`, `tools/` and `README.md`.
- **The private files are backed up in a private repository**, not in this one.
- **Public docs never link to private paths.** `bun run lint:docs` skips
  gitignored files as link targets, so such a link fails locally.
- **Brand-strategy vocabulary lives in `docs/brand/CONTEXT.md`**, which is
  private; the root `CONTEXT.md` keeps the Site terms.

### Rejected alternatives

- **Keeping everything public**: exposes the brand process and research.
- **Git submodule for private docs**: adds tooling for files only one person
  reads.

## Consequences

- A fresh clone has no private docs; `bun run brand:export` still works because
  it only reads the public `logo/` and `brandbook/fonts/`.
- Supersedes the "research lives in `docs/brand`" part of
  [ADR 0001](0001-brand-kit-in-docs-brand.md).
