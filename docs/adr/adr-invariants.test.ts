import { describe, expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ADR_DIRECTORY = import.meta.dir
const ADR_FILE_PATTERN = /^(\d{4})-[\da-z-]+\.md$/
const ALLOWED_STATUSES = /^(Accepted|Proposed|Deprecated|Superseded)\b/

interface AdrFile {
  readonly fileName: string
  readonly number: string
  readonly content: string
}

/**
 * Checks a set of ADRs against the repo invariants and returns one message per
 * violation. Pure so the fixtures below can exercise every rule.
 * @param adrs - The ADR files to check.
 * @param indexContent - The contents of the ADR index README.
 * @returns One message per violation, empty when all invariants hold.
 */
function findAdrViolations(
  adrs: readonly AdrFile[],
  indexContent: string,
): string[] {
  const violations: string[] = []
  const numbers = adrs.map((adr) => Number(adr.number))

  if (new Set(numbers).size !== numbers.length) {
    violations.push('duplicate ADR number')
  }
  if (numbers.some((number, index) => number !== index + 1)) {
    violations.push('ADR numbers are not sequential from 0001')
  }

  for (const adr of adrs) {
    const firstLine = adr.content.split('\n', 1)[0] ?? ''
    if (!new RegExp(String.raw`^# ${adr.number}: \S.*$`).test(firstLine)) {
      violations.push(`${adr.fileName}: bad header`)
    }
    const status = /^## Status\n\n(.+)/m.exec(adr.content)?.[1] ?? ''
    if (!ALLOWED_STATUSES.test(status)) {
      violations.push(`${adr.fileName}: unknown status "${status}"`)
    }
    if (!indexContent.includes(`](${adr.fileName})`)) {
      violations.push(`${adr.fileName}: not listed in README`)
    }
  }

  const linked = Array.from(
    indexContent.matchAll(/\]\((\d{4}-[^)]+\.md)\)/g),
    (match) => match[1] ?? '',
  )
  const known = new Set(adrs.map((adr) => adr.fileName))
  for (const fileName of linked) {
    if (!known.has(fileName)) {
      violations.push(`${fileName}: listed in README but missing`)
    }
  }

  return violations
}

function readAdrs(): AdrFile[] {
  return readdirSync(ADR_DIRECTORY)
    .filter((fileName) => ADR_FILE_PATTERN.test(fileName))
    .toSorted((left, right) => left.localeCompare(right))
    .map((fileName) => ({
      fileName,
      number: ADR_FILE_PATTERN.exec(fileName)?.[1] ?? '',
      content: readFileSync(path.join(ADR_DIRECTORY, fileName), 'utf8'),
    }))
}

function fixtureAdr(number: string, status = 'Accepted'): AdrFile {
  return {
    fileName: `${number}-fixture.md`,
    number,
    content: `# ${number}: Fixture\n\n## Status\n\n${status}\n`,
  }
}

describe('ADR invariants', () => {
  it('holds for the real ADRs', () => {
    const adrs = readAdrs()
    expect(adrs.length).toBeGreaterThan(0)
    const indexContent = readFileSync(
      path.join(ADR_DIRECTORY, 'README.md'),
      'utf8',
    )
    expect(findAdrViolations(adrs, indexContent)).toEqual([])
  })
})

describe('findAdrViolations', () => {
  const index = '[a](0001-fixture.md) [b](0002-fixture.md)'

  it('accepts a valid set', () => {
    expect(
      findAdrViolations([fixtureAdr('0001'), fixtureAdr('0002')], index),
    ).toEqual([])
  })

  it('flags a duplicate number', () => {
    const violations = findAdrViolations(
      [fixtureAdr('0001'), fixtureAdr('0001')],
      index,
    )
    expect(violations).toContain('duplicate ADR number')
  })

  it('flags an unknown status', () => {
    const violations = findAdrViolations([fixtureAdr('0001', 'Maybe')], index)
    expect(violations).toContain('0001-fixture.md: unknown status "Maybe"')
  })

  it('flags an unlisted ADR', () => {
    const violations = findAdrViolations(
      [fixtureAdr('0001'), fixtureAdr('0002')],
      '[a](0001-fixture.md)',
    )
    expect(violations).toContain('0002-fixture.md: not listed in README')
  })

  it('flags a bad header and a gap in numbering', () => {
    const bad: AdrFile = { ...fixtureAdr('0003'), content: '# Oops\n' }
    const violations = findAdrViolations([fixtureAdr('0001'), bad], index)
    expect(violations).toContain('0003-fixture.md: bad header')
    expect(violations).toContain('ADR numbers are not sequential from 0001')
  })

  it('flags an index entry with no file', () => {
    const violations = findAdrViolations([fixtureAdr('0001')], index)
    expect(violations).toContain(
      '0002-fixture.md: listed in README but missing',
    )
  })
})
