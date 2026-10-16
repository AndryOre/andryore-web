# Contributing

Thanks for your interest in contributing to andryore.dev. This document covers
the conventions this repository expects from a pull request.

By participating in this project, you agree to abide by the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

This project uses [bun](https://bun.sh/) `1.4.2` as its package manager. Fork
the repository, clone your fork, then install dependencies:

```sh
bun install
```

Useful scripts (see `package.json` for the full list):

- `bun run check` runs the static checks: formatting, linting, type-checking and
  knip.
- `bun run test` runs the test suite.
- `bun run lint:docs` checks the links and anchors of the Markdown.

## Where to start

Open an issue first so the "why" is on the record, then send a pull request
against `main`. [`ROADMAP.md`](ROADMAP.md) describes where the project is
heading and [`GOVERNANCE.md`](GOVERNANCE.md) how decisions are made. Changes to
the brand assets (the logos, tokens, Open Graph image and avatar under
`docs/brand/`) or the Site's content need Andry's approval (see
[ADR 0007](docs/adr/0007-split-license.md)).

## Branch naming and commit format

Use a short, descriptive feature branch named `<type>/<slug>` (never work
directly on `main`). Commits and pull request titles follow
[Conventional Commits](https://www.conventionalcommits.org/) with a gitmoji, for
example `feat: ✨ add log page`. Details:
[Branch naming](docs/development.md#branch-naming) and
[Commit format](docs/development.md#commit-format).

## Merging

Pull requests are squash merged, keeping a linear history on `main`. The final
PR title becomes the commit message, so it must follow the format above. See
[Merging](docs/development.md#merging).

## CI

Run `bun run check` and `bun run test` locally before opening a PR. The
`CI passed` check must be green before a pull request can be merged. See
[CI](docs/development.md#ci).

## Code comments

Comments are TSDoc blocks on non-obvious exports only. See
[Code documentation](docs/development.md#code-documentation).

## Reporting security issues

Do not open a public issue for a security vulnerability. Report it privately as
described in [`.github/SECURITY.md`](.github/SECURITY.md).
