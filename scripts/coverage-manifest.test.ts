import { describe, expect, test } from 'bun:test'
import { readdirSync } from 'node:fs'
import path from 'node:path'

const REPOSITORY_ROOT = path.resolve(import.meta.dir, '..')

const SOURCE_ROOTS = [
  'scripts',
  'eslint-rules',
  'docs/brand/tools',
  'src',
] as const

const EXEMPTIONS: Readonly<Record<string, string>> = {
  'scripts/workflow-files.ts':
    'Workflow loader used by workflows-invariants.test.ts, which exercises it against the real workflows.',
  'docs/brand/tools/export.mjs':
    'Brand raster export CLI that needs a real browser and writes the committed rasters; its pure logic lives in brand-export-spec.mjs.',
}

const isTestFile = (file: string): boolean => /\.test\.(?:ts|mjs)$/.test(file)

const isSourceModule = (file: string): boolean =>
  /\.(?:ts|mjs)$/.test(file) && !/\.d\.m?ts$/.test(file) && !isTestFile(file)

/**
 * Finds source modules that have neither a colocated test nor an exemption.
 * @param files Repo-relative, forward-slash file paths.
 * @param exemptions Exemption reasons keyed by repo-relative module path.
 * @returns The modules missing both.
 */
function findUncoveredModules(
  files: readonly string[],
  exemptions: Readonly<Record<string, string>>,
): string[] {
  const testFiles = new Set(files.filter((file) => isTestFile(file)))
  return files.filter((file) => {
    if (!isSourceModule(file) || Object.hasOwn(exemptions, file)) return false
    const base = file.replace(/\.(?:ts|mjs)$/, '')
    return ['ts', 'mjs'].every(
      (extension) => !testFiles.has(`${base}.test.${extension}`),
    )
  })
}

/**
 * Finds exemptions that are stale: the module is gone, now has a test, or
 * carries no written reason.
 * @param files Repo-relative, forward-slash file paths.
 * @param exemptions Exemption reasons keyed by repo-relative module path.
 * @returns The offending exemption keys.
 */
function findStaleExemptions(
  files: readonly string[],
  exemptions: Readonly<Record<string, string>>,
): string[] {
  const fileSet = new Set(files)
  return Object.entries(exemptions)
    .filter(([file, reason]) => {
      const base = file.replace(/\.(?:ts|mjs)$/, '')
      const hasTest = ['ts', 'mjs'].some((extension) =>
        fileSet.has(`${base}.test.${extension}`),
      )
      return !fileSet.has(file) || hasTest || reason.trim() === ''
    })
    .map(([file]) => file)
}

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' ? [] : listFiles(absolute)
    }
    return absolute
  })
}

const repositoryFiles = SOURCE_ROOTS.flatMap((root) =>
  listFiles(path.join(REPOSITORY_ROOT, root)),
).map((file) => path.relative(REPOSITORY_ROOT, file).split(path.sep).join('/'))

describe('coverage manifest', () => {
  test('scans real modules, so the checks below are not vacuous', () => {
    expect(repositoryFiles.filter((file) => isSourceModule(file))).not.toEqual(
      [],
    )
  })

  test('every module has a colocated test or a written exemption', () => {
    expect(findUncoveredModules(repositoryFiles, EXEMPTIONS)).toEqual([])
  })

  test('exemptions are justified and not stale', () => {
    expect(findStaleExemptions(repositoryFiles, EXEMPTIONS)).toEqual([])
  })
})

describe('findUncoveredModules', () => {
  test('flags a module with neither a test nor an exemption', () => {
    expect(findUncoveredModules(['scripts/orphan.ts'], {})).toEqual([
      'scripts/orphan.ts',
    ])
  })

  test('accepts a colocated test of either extension', () => {
    expect(
      findUncoveredModules(
        ['scripts/a.ts', 'scripts/a.test.ts', 'tools/b.mjs', 'tools/b.test.ts'],
        {},
      ),
    ).toEqual([])
  })

  test('accepts an exempted module', () => {
    expect(
      findUncoveredModules(['scripts/a.ts'], { 'scripts/a.ts': 'reason' }),
    ).toEqual([])
  })

  test('ignores declaration files and test files', () => {
    expect(
      findUncoveredModules(['x/a.d.mts', 'x/a.d.ts', 'x/only.test.ts'], {}),
    ).toEqual([])
  })
})

describe('findStaleExemptions', () => {
  test('flags a missing module, a tested module and an empty reason', () => {
    const exemptions = {
      'scripts/gone.ts': 'reason',
      'scripts/tested.ts': 'reason',
      'scripts/blank.ts': '  ',
    }
    expect(
      findStaleExemptions(
        ['scripts/tested.ts', 'scripts/tested.test.ts', 'scripts/blank.ts'],
        exemptions,
      ),
    ).toEqual(['scripts/gone.ts', 'scripts/tested.ts', 'scripts/blank.ts'])
  })

  test('keeps a valid exemption', () => {
    expect(
      findStaleExemptions(['scripts/a.ts'], { 'scripts/a.ts': 'reason' }),
    ).toEqual([])
  })
})
