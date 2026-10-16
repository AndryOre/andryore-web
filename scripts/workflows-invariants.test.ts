import { describe, expect, test } from 'bun:test'

import {
  listWorkflowFiles,
  parseWorkflow,
  readWorkflow,
  type Workflow,
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
})
