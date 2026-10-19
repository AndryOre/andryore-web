# Troubleshooting

Common failures, grouped by symptom. Each entry gives the root cause and the
fix.

## `lint`, `typecheck` or the pre-commit hook crashes with a `TypeError` inside `typescript.js`

**Symptom**: a command fails at `require` time with a `TypeError` such as
`Cannot create property '...' on number '0'`, reached through
`typescript-eslint/dist/index.js`.

**Root cause**: a poisoned entry in Node's on-disk V8 compile cache
(`/tmp/node-compile-cache`), which ESLint opts into. It is not a real
TypeScript, Node or typescript-eslint incompatibility.

**Confirm**: prepend `NODE_DISABLE_COMPILE_CACHE=1` to the failing command. If
it passes, this is the cause.

**Fix**: run `bun run cache:clear`. It removes `/tmp/node-compile-cache`,
`.eslintcache` and `node_modules/.cache`. Do not change Node versions to fix it:
a new version only creates a fresh cache bucket and hides the corruption.

## ESLint reports stale results

**Symptom**: `bun run lint` still reports a finding you fixed, or misses one you
introduced.

**Root cause**: ESLint runs with `--cache --cache-strategy content`, so results
come from `.eslintcache` keyed by file content. A cache written by a different
config or plugin version can be out of step.

**Fix**: run `bun run lint` again, since the content strategy normally
self-corrects. If it persists, run `bun run cache:clear` and lint once more.
Never delete files by hand to work around the cache.

## ESLint warns "File ignored because of a matching ignore pattern"

**Symptom**: ESLint prints this warning for a file passed explicitly. With
`--max-warnings=0` the warning fails the run.

**Root cause**: `lint-staged` passes every staged file to ESLint, including ones
the flat config ignores (generated or vendored files). ESLint reports each as a
warning.

**Fix**: nothing to do locally. `lint-staged.config.mjs` passes
`--no-warn-ignored`, which silences the warning for ignored files only. If you
run `eslint` on a single ignored file yourself, add the same flag.

## A package cannot be resolved from a script or a tool

**Symptom**: a tool or a script fails with a module-not-found error for a
package that is not listed in `package.json`, although it is present in
`node_modules`.

**Root cause**: `bunfig.toml` sets `linker = "isolated"`. Each package sees only
its declared dependencies, and undeclared (phantom) dependencies are not hoisted
to the top level of `node_modules`.

**Fix**: declare the package in `package.json` with `bun add`, never rely on a
transitive one. After a linker or lockfile change, reinstall with
`bun install --frozen-lockfile`. `knip` reports unlisted dependencies, so
`bun run check` catches the mistake.

## "Cannot decrypt .env"

**Root cause**: `.env` is committed but encrypted with dotenvx
([ADR 0022](adr/0022-secrets-in-dotenvx-encrypted-env-files.md)). The private
key (`DOTENV_PRIVATE_KEY`) lives in `.env.keys`, which Git ignores, so a fresh
clone does not have it. The key has to come from Andry's backup; it cannot be
derived.

**Symptom**: a command run under `dotenvx run` (the Docker build, for example)
exits with an error shaped like
`[MISSING_PRIVATE_KEY] could not decrypt ... using private key 'DOTENV_PRIVATE_KEY=undefined'`.
In the running image, the live status and GitHub endpoints return their
unavailable state instead of failing.

`dev`, `build`, `preview`, `test` and `check` never need the key: without it the
Site builds with the committed grid snapshot and no Sound switch
([Configuration](configuration.md#keyless-clones)).

**Fix**: place the real `.env.keys` at the repository root, or set
`DOTENV_PRIVATE_KEY` in the environment. For a Docker build, pass it as a
secret: `docker build --secret id=DOTENV_PRIVATE_KEY,env=DOTENV_PRIVATE_KEY .`.
In Coolify, check that the application has Docker Build Secrets on and a
`DOTENV_PRIVATE_KEY` variable. Coolify's API returns secret values wrapped in
single quotes: strip them before `bun run env:encrypt`, or the encrypted value
carries stray quotes. Never print or decrypt the values to debug it.
