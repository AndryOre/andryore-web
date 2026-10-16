import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

import {
  listWorkflowFiles,
  parseWorkflow,
  readWorkflow,
  readWorkflowText,
  type Workflow,
  type WorkflowStep,
} from './workflow-files'

const FULL_SHA_PATTERN = /^[\da-f]{40}$/

/**
 * Collects every `uses:` reference of a workflow, job-level and step-level.
 * @param workflow The parsed workflow.
 * @returns The raw `uses:` values.
 */
function collectUses(workflow: Workflow): string[] {
  const jobs = Object.values(workflow.jobs ?? {})
  const jobUses = jobs.flatMap((job) => job.uses ?? [])
  const stepUses = jobs.flatMap((job) =>
    (job.steps ?? []).flatMap((step) => step.uses ?? []),
  )
  return [...jobUses, ...stepUses]
}

/**
 * Finds `uses:` references that are not pinned to a 40-character SHA.
 * Local actions (`./...`) are exempt.
 * @param workflow The parsed workflow.
 * @returns The offending `uses:` values.
 */
function findUnpinnedUses(workflow: Workflow): string[] {
  return collectUses(workflow).filter((reference) => {
    if (reference.startsWith('./')) return false
    const revision = reference.split('@', 2)[1] ?? ''
    return !FULL_SHA_PATTERN.test(revision)
  })
}

/**
 * Whether a workflow declares explicit `permissions` at the top level or on
 * every job.
 * @param workflow The parsed workflow.
 * @returns True when permissions are explicit everywhere they apply.
 */
function declaresExplicitPermissions(workflow: Workflow): boolean {
  if (workflow.permissions !== undefined) return true
  const jobs = Object.values(workflow.jobs ?? {})
  return jobs.length > 0 && jobs.every((job) => job.permissions !== undefined)
}

/**
 * Collects every step of a workflow.
 * @param workflow The parsed workflow.
 * @returns The steps of all jobs.
 */
function collectSteps(workflow: Workflow): WorkflowStep[] {
  return Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? [])
}

/**
 * Lists the event names a workflow triggers on.
 * @param workflow The parsed workflow.
 * @returns The names of the events that start the workflow.
 */
function triggerNames(workflow: Workflow): string[] {
  const trigger = workflow.on
  if (typeof trigger === 'string') return [trigger]
  if (Array.isArray(trigger)) return trigger.map(String)
  return trigger !== null && typeof trigger === 'object'
    ? Object.keys(trigger)
    : []
}

/**
 * Finds jobs that do not declare a numeric `timeout-minutes`.
 * @param workflow The parsed workflow.
 * @returns The offending job names.
 */
function findJobsWithoutTimeout(workflow: Workflow): string[] {
  return Object.entries(workflow.jobs ?? {})
    .filter(([, job]) => typeof job['timeout-minutes'] !== 'number')
    .map(([jobName]) => jobName)
}

/**
 * Finds jobs whose `actions/checkout` keeps the token in the git config. A job
 * that pushes may opt in with an explicit `persist-credentials: true` only
 * when it also holds `contents: write`.
 * @param workflow The parsed workflow.
 * @returns The offending job names.
 */
function findCheckoutsPersistingCredentials(workflow: Workflow): string[] {
  return Object.entries(workflow.jobs ?? {})
    .filter(([, job]) => {
      const permissions = job.permissions as Record<string, unknown> | undefined
      const mayPush = permissions?.contents === 'write'
      return (job.steps ?? []).some((step) => {
        if (!step.uses?.startsWith('actions/checkout@')) return false
        const persist = step.with?.['persist-credentials']
        return !(persist === false || (persist === true && mayPush))
      })
    })
    .map(([jobName]) => jobName)
}

/**
 * Finds `run:` scripts that interpolate a `${{ }}` expression.
 * @param workflow The parsed workflow.
 * @returns The offending scripts.
 */
function findExpressionsInRun(workflow: Workflow): string[] {
  return collectSteps(workflow)
    .map((step) => step.run ?? '')
    .filter((script) => script.includes('${{'))
}

/**
 * Whether the top-level permissions are `contents: read` or stricter.
 * @param workflow The parsed workflow.
 * @returns True for `{}` or exactly `{ contents: read }`.
 */
function hasReadOnlyTopLevelPermissions(workflow: Workflow): boolean {
  const permissions = workflow.permissions
  if (permissions === null || typeof permissions !== 'object') return false
  const entries = Object.entries(permissions)
  return (
    entries.length === 0 ||
    (entries.length === 1 &&
      entries[0]?.[0] === 'contents' &&
      entries[0][1] === 'read')
  )
}

/**
 * Finds the release gate step that requires a green `CI passed` check run.
 * @param workflow The parsed release workflow.
 * @returns The gate step, when present.
 */
function findReleaseGate(workflow: Workflow): WorkflowStep | undefined {
  return collectSteps(workflow).find(
    (step) =>
      step.name === 'Require green CI on the tagged commit' &&
      (step.run ?? '').includes('"CI passed"') &&
      (step.run ?? '').includes('check-runs') &&
      (step.run ?? '').includes('"success"'),
  )
}

const RELEASE_KEPT_FRAGMENTS = [
  'merge-base --is-ancestor',
  'release-notes.md',
  'gh release view',
  'gh release create',
  '--prerelease --latest=false',
] as const

/**
 * Finds release behaviour that the release script no longer contains.
 * @param workflow The parsed release workflow.
 * @returns The missing script fragments.
 */
function findMissingReleaseBehaviour(workflow: Workflow): string[] {
  const script = collectSteps(workflow)
    .map((step) => step.run ?? '')
    .join('\n')
  return RELEASE_KEPT_FRAGMENTS.filter((fragment) => !script.includes(fragment))
}

/**
 * Whether the ESLint cache step keys on the local ESLint rules.
 * @param workflow The parsed CI workflow.
 * @returns True when the cache key hashes `eslint-rules/**`.
 */
function eslintCacheKeysOnLocalRules(workflow: Workflow): boolean {
  const cacheStep = collectSteps(workflow).find(
    (step) =>
      typeof step.with?.path === 'string' &&
      step.with.path.includes('.eslintcache'),
  )
  const key = cacheStep?.with?.key
  return typeof key === 'string' && key.includes('eslint-rules/**')
}

/**
 * Lists the job `name:` values of a workflow.
 * @param workflow The parsed workflow.
 * @returns The display names of the jobs.
 */
function collectJobNames(workflow: Workflow): string[] {
  return Object.values(workflow.jobs ?? {}).flatMap((job) => job.name ?? [])
}

/**
 * Finds required status check contexts that no job name provides.
 * @param rulesetText The ruleset JSON text.
 * @param jobNames Every job name across the workflows.
 * @returns The contexts without a matching job.
 */
function findUnmatchedRequiredContexts(
  rulesetText: string,
  jobNames: readonly string[],
): string[] {
  const ruleset = JSON.parse(rulesetText) as {
    rules: {
      type: string
      parameters?: { required_status_checks?: { context: string }[] }
    }[]
  }
  return ruleset.rules
    .filter((rule) => rule.type === 'required_status_checks')
    .flatMap((rule) => rule.parameters?.required_status_checks ?? [])
    .map((check) => check.context)
    .filter((context) => !jobNames.includes(context))
}

const PINNED_SHA = 'a'.repeat(40)

describe('invariant detectors', () => {
  test('flags a tag-pinned action', () => {
    const workflow = parseWorkflow(`
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`)
    expect(findUnpinnedUses(workflow)).toEqual(['actions/checkout@v4'])
  })

  test('flags a branch-pinned reusable workflow and a short SHA', () => {
    const workflow = parseWorkflow(`
on: push
jobs:
  reuse:
    uses: owner/repo/workflows/x.yml@main
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@abc1234
`)
    expect(findUnpinnedUses(workflow)).toEqual([
      'owner/repo/workflows/x.yml@main',
      'actions/checkout@abc1234',
    ])
  })

  test('accepts a SHA-pinned action and a local action', () => {
    const workflow = parseWorkflow(`
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@${PINNED_SHA} # v4
      - uses: ./local-action
`)
    expect(findUnpinnedUses(workflow)).toEqual([])
  })

  test('flags a workflow without permissions', () => {
    const workflow = parseWorkflow(`
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hi
`)
    expect(declaresExplicitPermissions(workflow)).toBe(false)
  })

  test('accepts top-level permissions and per-job permissions', () => {
    const topLevel = parseWorkflow(`
on: push
permissions: {}
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hi
`)
    const perJob = parseWorkflow(`
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - run: echo hi
`)
    expect(declaresExplicitPermissions(topLevel)).toBe(true)
    expect(declaresExplicitPermissions(perJob)).toBe(true)
  })

  test('flags per-job permissions that miss a job', () => {
    const workflow = parseWorkflow(`
on: push
jobs:
  first:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - run: echo hi
  second:
    runs-on: ubuntu-latest
    steps:
      - run: echo hi
`)
    expect(declaresExplicitPermissions(workflow)).toBe(false)
  })
})

const JOB_HEADER = `
on: push
jobs:
  build:
    runs-on: ubuntu-latest
`
const CHECKOUT = `actions/checkout@${PINNED_SHA}`

describe('hardening detectors', () => {
  test('flags a job without timeout-minutes', () => {
    const bad = parseWorkflow(`${JOB_HEADER}    steps:
      - run: echo hi
`)
    const good = parseWorkflow(`${JOB_HEADER}    timeout-minutes: 5
    steps:
      - run: echo hi
`)
    expect(findJobsWithoutTimeout(bad)).toEqual(['build'])
    expect(findJobsWithoutTimeout(good)).toEqual([])
  })

  test('flags a checkout that keeps credentials', () => {
    const missing = parseWorkflow(`${JOB_HEADER}    steps:
      - uses: ${CHECKOUT}
`)
    const disabled = parseWorkflow(`${JOB_HEADER}    steps:
      - uses: ${CHECKOUT}
        with:
          persist-credentials: false
`)
    expect(findCheckoutsPersistingCredentials(missing)).toEqual(['build'])
    expect(findCheckoutsPersistingCredentials(disabled)).toEqual([])
  })

  test('allows explicit persist-credentials only for a pushing job', () => {
    const steps = `    steps:
      - uses: ${CHECKOUT}
        with:
          persist-credentials: true
`
    const pushing = parseWorkflow(`${JOB_HEADER}    permissions:
      contents: write
${steps}`)
    const readOnly = parseWorkflow(`${JOB_HEADER}    permissions:
      contents: read
${steps}`)
    expect(findCheckoutsPersistingCredentials(pushing)).toEqual([])
    expect(findCheckoutsPersistingCredentials(readOnly)).toEqual(['build'])
  })

  test('flags the pull_request_target trigger', () => {
    const bad = parseWorkflow('on:\n  pull_request_target:\njobs: {}\n')
    const list = parseWorkflow('on: [push, pull_request_target]\njobs: {}\n')
    const good = parseWorkflow('on:\n  pull_request:\njobs: {}\n')
    expect(triggerNames(bad)).toContain('pull_request_target')
    expect(triggerNames(list)).toContain('pull_request_target')
    expect(triggerNames(good)).not.toContain('pull_request_target')
  })

  test('flags an expression inside run', () => {
    const bad = parseWorkflow(`${JOB_HEADER}    steps:
      - run: echo \${{ github.actor }}
`)
    const good = parseWorkflow(`${JOB_HEADER}    steps:
      - env:
          ACTOR: \${{ github.actor }}
        run: echo "$ACTOR"
`)
    expect(findExpressionsInRun(bad)).toHaveLength(1)
    expect(findExpressionsInRun(good)).toEqual([])
  })

  test('accepts only contents: read or stricter at the top level', () => {
    const withPermissions = (permissions: string) =>
      parseWorkflow(`on: push\npermissions: ${permissions}\njobs: {}\n`)
    expect(hasReadOnlyTopLevelPermissions(withPermissions('{}'))).toBe(true)
    expect(
      hasReadOnlyTopLevelPermissions(withPermissions('{ contents: read }')),
    ).toBe(true)
    expect(
      hasReadOnlyTopLevelPermissions(withPermissions('{ contents: write }')),
    ).toBe(false)
    expect(hasReadOnlyTopLevelPermissions(withPermissions('write-all'))).toBe(
      false,
    )
    expect(
      hasReadOnlyTopLevelPermissions(
        withPermissions('{ contents: read, issues: write }'),
      ),
    ).toBe(false)
    expect(
      hasReadOnlyTopLevelPermissions(parseWorkflow('on: push\njobs: {}\n')),
    ).toBe(false)
  })
})

/**
 * Builds a release workflow whose only step runs the given script.
 * @param run The script body.
 * @returns The parsed workflow.
 */
function releaseWithRun(run: string): Workflow {
  return { jobs: { release: { steps: [{ run }] } } }
}

/**
 * Builds a CI workflow with an ESLint cache step using the given key.
 * @param key The cache key expression.
 * @returns The parsed workflow.
 */
function ciWithCacheKey(key: string): Workflow {
  return parseWorkflow(
    `on: push\njobs:\n  quality:\n    steps:\n      - uses: a/b@${PINNED_SHA}\n        with:\n          path: .eslintcache\n          key: ${key}\n`,
  )
}

describe('release and ci detectors', () => {
  const gate = `
on: push
jobs:
  release:
    steps:
      - name: Require green CI on the tagged commit
        run: gh api repos/x/commits/y/check-runs | grep "CI passed" "success"
`

  test('flags a release without the green-CI gate', () => {
    expect(findReleaseGate(parseWorkflow(gate))).toBeDefined()
    expect(
      findReleaseGate(
        parseWorkflow(
          'on: push\njobs:\n  release:\n    steps:\n      - run: echo hi\n',
        ),
      ),
    ).toBeUndefined()
  })

  test('flags a release that dropped a kept behaviour', () => {
    const complete = RELEASE_KEPT_FRAGMENTS.join('\n')
    expect(findMissingReleaseBehaviour(releaseWithRun(complete))).toEqual([])
    const withoutFlags = complete.replace('--prerelease --latest=false', '')
    expect(findMissingReleaseBehaviour(releaseWithRun(withoutFlags))).toEqual([
      '--prerelease --latest=false',
    ])
    expect(findMissingReleaseBehaviour(releaseWithRun(''))).toHaveLength(
      RELEASE_KEPT_FRAGMENTS.length,
    )
  })

  test('flags an eslint cache key without the local rules', () => {
    expect(
      eslintCacheKeysOnLocalRules(
        ciWithCacheKey("${{ hashFiles('bun.lock') }}"),
      ),
    ).toBe(false)
    expect(
      eslintCacheKeysOnLocalRules(
        ciWithCacheKey("${{ hashFiles('eslint-rules/**') }}"),
      ),
    ).toBe(true)
  })

  test('flags a required context that no job name provides', () => {
    const ruleset = JSON.stringify({
      rules: [
        {
          type: 'required_status_checks',
          parameters: {
            required_status_checks: [{ context: 'A' }, { context: 'B' }],
          },
        },
        { type: 'deletion' },
      ],
    })
    expect(findUnmatchedRequiredContexts(ruleset, ['A', 'B'])).toEqual([])
    expect(findUnmatchedRequiredContexts(ruleset, ['A'])).toEqual(['B'])
  })
})

describe('release.yml gates', () => {
  const release = readWorkflow('release.yml')

  test('requires a green CI passed check run before the Release', () => {
    expect(findReleaseGate(release)).toBeDefined()
    const names = collectSteps(release).map((step) => step.name)
    expect(names.indexOf('Require green CI on the tagged commit')).toBeLessThan(
      names.indexOf('Create GitHub Release'),
    )
  })

  test('keeps main ancestry, notes, idempotent create and prerelease flags', () => {
    expect(findMissingReleaseBehaviour(release)).toEqual([])
  })
})

describe('ci.yml gates', () => {
  const ci = readWorkflow('ci.yml')

  test('keys the eslint cache on eslint-rules/**', () => {
    expect(eslintCacheKeysOnLocalRules(ci)).toBe(true)
  })

  test('the CI passed aggregate needs the build job', () => {
    expect(ci.jobs?.['ci-passed']?.needs).toContain('build')
    expect(ci.jobs?.build?.name).toBe('Build')
  })
})

test('every required ruleset context matches a workflow job name', () => {
  const rulesetText = readFileSync(
    new URL('../.github/rulesets/main.json', import.meta.url),
    'utf8',
  )
  const jobNames = listWorkflowFiles().flatMap((fileName) =>
    collectJobNames(parseWorkflow(readWorkflowText(fileName))),
  )
  expect(findUnmatchedRequiredContexts(rulesetText, jobNames)).toEqual([])
})

test('there is at least one workflow to check', () => {
  expect(listWorkflowFiles().length).toBeGreaterThan(0)
})

describe.each(listWorkflowFiles())('%s', (fileName) => {
  const workflow = readWorkflow(fileName)

  test('every uses: is pinned to a 40-character SHA', () => {
    expect(findUnpinnedUses(workflow)).toEqual([])
  })

  test('declares explicit permissions', () => {
    expect(declaresExplicitPermissions(workflow)).toBe(true)
  })

  test('every job declares timeout-minutes', () => {
    expect(findJobsWithoutTimeout(workflow)).toEqual([])
  })

  test('every checkout sets persist-credentials: false', () => {
    expect(findCheckoutsPersistingCredentials(workflow)).toEqual([])
  })

  test('does not use pull_request_target', () => {
    expect(triggerNames(workflow)).not.toContain('pull_request_target')
  })

  test('no run script interpolates an expression', () => {
    expect(findExpressionsInRun(workflow)).toEqual([])
  })

  test('top-level permissions are contents: read or stricter', () => {
    expect(hasReadOnlyTopLevelPermissions(workflow)).toBe(true)
  })
})
