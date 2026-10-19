# 0022: Secrets live in dotenvx-encrypted env files

## Status

Accepted. Amends [0004](0004-live-status-endpoint.md),
[0011](0011-public-repo-security-posture.md),
[0017](0017-github-contributions-via-runtime-endpoint.md) and
[0019](0019-optional-interface-sound.md): their credentials move from Coolify
secrets to an encrypted env file in the repository.

Date: 2026-10-20

## Context

The Site has four credentials: the Twitch client id and secret (0004), a GitHub
token (0017) and a read-only token for the private sound repository (0019). They
lived only in the Coolify UI, so the repository could not say what the Site
needs, the Docker build never received the GitHub token, and every credential
was a separate Coolify entry with its own build or runtime flag.

Andry wants configuration versioned with the code and Coolify to hold a single
value. [Streamboss](https://github.com/AndryOre/streamboss) already works this
way with [dotenvx](https://dotenvx.com). Snug adopted it and reversed the
decision in its own ADR 0022: this repository is public, so the ciphertext stays
in history forever, and a leaked key exposes every value ever committed. The
same risk applies here, and Andry accepts it.

## Decision

- **Credentials live in `.env`, encrypted with dotenvx and committed.**
  `.env.development` holds the local-development values the same way.
  `.env.example` lists the variable names in plain text. `.env.keys` holds the
  private keys, is ignored by Git and Docker, and is backed up by Andry.
- **Coolify keeps one value, `DOTENV_PRIVATE_KEY`**, the key for `.env`. It
  reaches the Docker build as a BuildKit secret, so it never enters an image
  layer.
- **The build runs under `dotenvx run`.** The sound fetch and the Astro build
  both see the credentials, so the GitHub contribution grid is fetched fresh on
  every deploy. `src/content/github-grid.json` stays as the fallback for clones
  and CI that have no key.
- **The runtime endpoint decrypts `.env` itself.** The runtime image has no
  JavaScript runtime to run the dotenvx CLI, so the stream-status server loads
  the file through a small module compiled into its binary. A missing key or
  file means no credentials, and the endpoint behaves as it does today when a
  token is missing.
- **A fresh clone needs no key.** `dev`, `build`, `test` and `check` work
  without one; only the credentials-backed features fall back.
- **A pre-commit guard** refuses a plaintext `.env` or `.env.keys`.
- **Revoking means rotating the credentials.** Because the ciphertext is public
  history, a key leak is handled by rotating the Twitch secret and both tokens,
  then re-encrypting. Rotating only the key does not help.

### Rejected alternatives

- **Keeping the Coolify secrets** (Snug's choice): nothing in public history,
  but configuration stays invisible to the repository and the build never gets
  the GitHub token.
- **Encrypting only for local development**: Coolify would still hold four
  values, so it solves nothing in production.

## Consequences

- Every credential ever committed is permanently in public history. The
  encryption is the only barrier.
- The Docker build and the runtime image gain a dependency on dotenvx.
- Rotating a credential is a commit, not a Coolify edit.
- The variables and the workflow are documented in `docs/configuration.md`.
