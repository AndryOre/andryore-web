import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Pinned Lighthouse release. Renovate bumps it through the custom manager in
 * `renovate.json5`, which matches this exact declaration.
 */
export const LIGHTHOUSE_VERSION = '13.5.0'

/** Lighthouse categories the gate scores, in report order. */
export const CATEGORIES = [
  'performance',
  'accessibility',
  'best-practices',
  'seo',
] as const

export type Category = (typeof CATEGORIES)[number]

/** Minimum score, out of 100, every category must reach on every page. */
export const SCORE_THRESHOLD = 90

/** Lighthouse runs per page; the median of them is what is judged. */
export const RUNS_PER_PAGE = 5

/** Pages audited: home and one Log entry, in English and Spanish. */
export const AUDITED_PATHS: readonly string[] = [
  '/',
  '/es/',
  '/log/nothing-from-other-origins/',
  '/es/log/nothing-from-other-origins/',
]

export type CategoryScores = Record<Category, number | null>

export interface RunResult {
  readonly scores: CategoryScores
  readonly totalBytes: number | null
}

export interface PageResult extends RunResult {
  readonly path: string
}

export interface RunnerOptions {
  readonly command?: string
  readonly chromePath?: string
}

/**
 * Median of a list of numbers; the mean of the two middle values when the
 * count is even.
 * @param values Samples, in any order.
 * @returns The central value of the samples.
 * @throws {Error} When the list is empty.
 */
export function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error('median of an empty list')
  const sorted = values.toSorted((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const upper = sorted[middle] ?? 0
  const lower = sorted[middle - 1] ?? upper
  return sorted.length % 2 === 1 ? upper : (lower + upper) / 2
}

interface LighthouseJson {
  readonly categories?: Record<string, { readonly score?: number | null }>
  readonly audits?: Record<string, { readonly numericValue?: number }>
}

/**
 * Extracts the four category scores (0 to 100, null when missing) and the
 * total transfer weight from a Lighthouse JSON report.
 * @param json The raw JSON text printed by Lighthouse.
 * @returns The scores and the byte weight.
 */
export function parseReport(json: string): RunResult {
  const report = JSON.parse(json) as LighthouseJson
  const scoreOf = (category: Category): number | null => {
    const raw = report.categories?.[category]?.score
    return typeof raw === 'number' ? Math.round(raw * 100) : null
  }
  const bytes = report.audits?.['total-byte-weight']?.numericValue
  return {
    scores: {
      performance: scoreOf('performance'),
      accessibility: scoreOf('accessibility'),
      'best-practices': scoreOf('best-practices'),
      seo: scoreOf('seo'),
    },
    totalBytes: typeof bytes === 'number' ? bytes : null,
  }
}

/**
 * Collapses the runs of one page into median scores. A category that is null
 * in any run stays null, so the gate fails instead of hiding a broken run.
 * @param runs The parsed runs of one page.
 * @returns The per-category median scores and the median weight.
 */
export function summarizeRuns(runs: readonly RunResult[]): RunResult {
  const scoreFor = (category: Category): number | null => {
    const values = runs.map((run) => run.scores[category])
    return values.includes(null) ? null : median(values as number[])
  }
  const bytes = runs.flatMap((run) => run.totalBytes ?? [])
  return {
    scores: {
      performance: scoreFor('performance'),
      accessibility: scoreFor('accessibility'),
      'best-practices': scoreFor('best-practices'),
      seo: scoreFor('seo'),
    },
    totalBytes: bytes.length > 0 ? median(bytes) : null,
  }
}

/**
 * Lists every category that is null or below the threshold. Weight never
 * produces a failure.
 * @param results The per-page results.
 * @returns One human-readable line per failure.
 */
export function findFailures(results: readonly PageResult[]): string[] {
  const failures: string[] = []
  for (const page of results) {
    for (const category of CATEGORIES) {
      const score = page.scores[category]
      if (score === null) {
        failures.push(`${page.path} ${category}: no score`)
      } else if (score < SCORE_THRESHOLD) {
        const line = `${page.path} ${category}: ${String(score)}`
        failures.push(`${line} < ${String(SCORE_THRESHOLD)}`)
      }
    }
  }
  return failures
}

/**
 * Formats the results as an aligned table. Weight is informational only.
 * @param results The per-page results.
 * @returns The table text.
 */
export function formatTable(results: readonly PageResult[]): string {
  const header = ['page', 'perf', 'a11y', 'bp', 'seo', 'weight']
  const rows = results.map((page) => [
    page.path,
    ...CATEGORIES.map((category) => String(page.scores[category] ?? 'null')),
    page.totalBytes === null
      ? 'n/a'
      : `${(page.totalBytes / 1024).toFixed(1)} KiB`,
  ])
  const widths = header.map((_, column) =>
    Math.max(...[header, ...rows].map((row) => (row[column] ?? '').length)),
  )
  return [header, ...rows]
    .map((row) =>
      row.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join('  '),
    )
    .join('\n')
}

/**
 * Runs Lighthouse once against a URL through `bunx` and parses the report.
 * @param url The page URL.
 * @param options The command to run (default `bunx`) and the Chrome binary.
 * @returns The parsed run.
 * @throws {Error} When the process exits non-zero.
 */
export async function runLighthouseOnce(
  url: string,
  options: RunnerOptions = {},
): Promise<RunResult> {
  const processHandle = Bun.spawn(
    [
      options.command ?? 'bunx',
      `lighthouse@${LIGHTHOUSE_VERSION}`,
      url,
      '--output=json',
      '--output-path=stdout',
      `--only-categories=${CATEGORIES.join(',')}`,
      '--chrome-flags=--headless=new --no-sandbox',
      '--quiet',
    ],
    {
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        ...(options.chromePath && { CHROME_PATH: options.chromePath }),
      },
    },
  )
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(processHandle.stdout).text(),
    new Response(processHandle.stderr).text(),
    processHandle.exited,
  ])
  if (exitCode !== 0) {
    throw new Error(
      `lighthouse failed for ${url} (${String(exitCode)}): ${stderr}`,
    )
  }
  return parseReport(stdout)
}

/**
 * Audits every page `RUNS_PER_PAGE` times, sequentially.
 * @param baseUrl The origin serving the built site.
 * @param paths The paths to audit.
 * @param options The runner options.
 * @returns One summarized result per path.
 */
export async function auditPages(
  baseUrl: string,
  paths: readonly string[],
  options: RunnerOptions = {},
): Promise<PageResult[]> {
  const results: PageResult[] = []
  for (const pagePath of paths) {
    const runs: RunResult[] = []
    for (let run = 0; run < RUNS_PER_PAGE; run += 1) {
      runs.push(await runLighthouseOnce(`${baseUrl}${pagePath}`, options))
    }
    results.push({ path: pagePath, ...summarizeRuns(runs) })
  }
  return results
}

/**
 * Resolves a request path to a file inside the built directory.
 * @param distributionDirectory The build output directory.
 * @param pathname The URL pathname.
 * @returns The file path, or null when nothing matches or it escapes `dist`.
 */
export function resolveStaticFile(
  distributionDirectory: string,
  pathname: string,
): string | null {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '')
  const candidate = path.resolve(distributionDirectory, relative)
  if (!candidate.startsWith(path.resolve(distributionDirectory))) return null
  const file = pathname.endsWith('/')
    ? path.join(candidate, 'index.html')
    : candidate
  return existsSync(file) ? file : null
}

/**
 * Serves the built site on a free local port.
 * @param distributionDirectory The build output directory.
 * @returns The running server.
 */
function serveDistribution(distributionDirectory: string) {
  return Bun.serve({
    port: 0,
    fetch(request) {
      const file = resolveStaticFile(
        distributionDirectory,
        new URL(request.url).pathname,
      )
      return file
        ? new Response(Bun.file(file))
        : new Response('Not found', { status: 404 })
    },
  })
}

/**
 * Entry point: serves `dist`, audits the pages, prints the table and returns
 * the process exit code.
 * @returns 0 when every category reaches the threshold, 1 otherwise.
 */
export async function main(): Promise<number> {
  const distributionDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../dist',
  )
  if (!existsSync(distributionDirectory)) {
    console.error('dist/ not found: run `bun run build` first.')
    return 1
  }
  const server = serveDistribution(distributionDirectory)
  try {
    const results = await auditPages(
      `http://localhost:${String(server.port)}`,
      AUDITED_PATHS,
      { chromePath: process.env.CHROME_PATH },
    )
    console.log(formatTable(results))
    const failures = findFailures(results)
    if (failures.length > 0) {
      console.error(
        `\nBelow ${String(SCORE_THRESHOLD)}:\n${failures.join('\n')}`,
      )
      return 1
    }
    return 0
  } finally {
    void server.stop(true)
  }
}

if (import.meta.main) process.exitCode = await main()
