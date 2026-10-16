# Documentation

Technical documentation for the andryore.dev repository. Start with
[Development](./development.md) for the scripts, hooks, CI and releasing;
otherwise jump to whatever is relevant below.

## Core

- [Development](./development.md): setup, the `package.json` scripts, coverage,
  git hooks, branch and commit conventions, CI, releasing and the repository
  settings.
- [Troubleshooting](./troubleshooting.md): common failures grouped by symptom,
  each with its root cause and fix.

## Architecture decision records

- [ADR index](./adr/README.md): every decision, in Nygard format, with its
  status. Read the relevant ADR before changing what it covers.

## Brand

- [Brand kit](./brand/README.md): the public logo, tokens, OG and avatar assets
  and the export tooling. The brand strategy documents are private and stay out
  of the repository ([ADR 0008](./adr/0008-private-docs-stay-local.md)).

## Agent configuration

- [Domain docs](./agents/domain.md): how skills consume the domain
  documentation.
- [Issue tracker](./agents/issue-tracker.md): the Linear conventions.
- [Triage labels](./agents/triage-labels.md): the label vocabulary.
- [`/forge`](./agents/forge.md): the repo-specific rules for the parallel
  worktree pipeline.

The root [`AGENTS.md`](../AGENTS.md) holds the rules every coding agent follows,
and [`CONTEXT.md`](../CONTEXT.md) the domain vocabulary.
