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
