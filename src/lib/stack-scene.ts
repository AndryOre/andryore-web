import uses from '../content/uses.json'
import type { Locale } from '../i18n/locales'
import type { IconId } from './icons'

/** Pixel size of the three tile boxes at the canvas scale. */
export type TileSize = 96 | 72 | 56

/** One decorative tile of a scattered field. */
export interface StackTile {
  id: GlowIconId
  size: TileSize
  mobile: boolean
  placement: string
}

/** One tile of the end card. */
export interface EndCardTile {
  id: GlowIconId
  tilt: string
}

/**
 * Literal Tailwind classes for the brand glow (`--g`) of each icon the scene
 * uses; the black and white logos take the neutral `#8b93a7`. They are
 * literals because the CSP forbids inline styles and Tailwind only emits
 * classes it can read.
 */
export const GLOW_CLASSES = {
  typescript: '[--g:#3178c6]',
  bun: '[--g:#fbf0df]',
  react: '[--g:#61dafb]',
  nextjs: '[--g:#8b93a7]',
  hono: '[--g:#e36002]',
  tailwindcss: '[--g:#06b6d4]',
  'shadcn-ui': '[--g:#8b93a7]',
  prisma: '[--g:#2d3748]',
  supabase: '[--g:#3fcf8e]',
  zod: '[--g:#3068b7]',
  tanstack: '[--g:#ece8d1]',
  'better-auth': '[--g:#ffffff]',
  resend: '[--g:#8b93a7]',
  posthog: '[--g:#f54e00]',
  playwright: '[--g:#2ead33]',
  eslint: '[--g:#4b32c3]',
  claude: '[--g:#d97757]',
  docker: '[--g:#2496ed]',
  git: '[--g:#f05032]',
  linear: '[--g:#5e6ad2]',
  cloudflare: '[--g:#f38020]',
  tailscale: '[--g:#8b93a7]',
  'github-actions': '[--g:#2088ff]',
  remotion: '[--g:#0b84f3]',
  astro: '[--g:#bc52ee]',
} as const satisfies Partial<Record<IconId, string>>

/** Icons that have a glow class. */
export type GlowIconId = keyof typeof GLOW_CLASSES

/**
 * Brand hex of the glow of an icon, read from its literal class.
 * @param id An icon with a glow class.
 * @returns The `#rrggbb` colour.
 */
export function glowHex(id: GlowIconId): string {
  const hex = /#[0-9a-f]{6}/.exec(GLOW_CLASSES[id])?.[0]
  if (hex === undefined) throw new Error(`No glow hex for icon "${id}"`)
  return hex
}

const SIZE_CLASSES: Readonly<Record<TileSize, string>> = {
  96: '[--s:96]',
  72: '[--s:72]',
  56: '[--s:56]',
}

/**
 * Class that sets the box size (`--s`, in pixels) of a tile.
 * @param size A tile size.
 * @returns A literal Tailwind class.
 */
export function sizeClass(size: TileSize): string {
  return SIZE_CLASSES[size]
}

/**
 * The scattered field in DOM order. Coordinates are container units from the
 * stage centre, so the scene scales with its stage. The tiles with `mobile`
 * set stay on narrow screens, in the bands above and below the copy.
 */
export const STACK_TILES: readonly StackTile[] = [
  {
    id: 'typescript',
    size: 96,
    mobile: true,
    placement: '[--x:-30cqw] [--y:-42cqh] [--r:-9deg]',
  },
  {
    id: 'react',
    size: 72,
    mobile: true,
    placement: '[--x:2cqw] [--y:-44cqh] [--r:7deg]',
  },
  {
    id: 'nextjs',
    size: 56,
    mobile: true,
    placement: '[--x:32cqw] [--y:-41cqh] [--r:-5deg]',
  },
  {
    id: 'bun',
    size: 72,
    mobile: true,
    placement: '[--x:-14cqw] [--y:-32cqh] [--r:12deg]',
  },
  {
    id: 'tailwindcss',
    size: 56,
    mobile: true,
    placement: '[--x:18cqw] [--y:-33cqh] [--r:-11deg]',
  },
  {
    id: 'claude',
    size: 72,
    mobile: true,
    placement: '[--x:-34cqw] [--y:36cqh] [--r:6deg]',
  },
  {
    id: 'prisma',
    size: 96,
    mobile: true,
    placement: '[--x:0cqw] [--y:41cqh] [--r:-8deg]',
  },
  {
    id: 'playwright',
    size: 56,
    mobile: true,
    placement: '[--x:33cqw] [--y:37cqh] [--r:10deg]',
  },
  {
    id: 'docker',
    size: 56,
    mobile: true,
    placement: '[--x:-17cqw] [--y:43cqh] [--r:-6deg]',
  },
  {
    id: 'supabase',
    size: 72,
    mobile: true,
    placement: '[--x:19cqw] [--y:44cqh] [--r:5deg]',
  },
  {
    id: 'git',
    size: 56,
    mobile: true,
    placement: '[--x:-36cqw] [--y:-36cqh] [--r:8deg]',
  },
  {
    id: 'zod',
    size: 56,
    mobile: true,
    placement: '[--x:38cqw] [--y:-33cqh] [--r:-12deg]',
  },
  {
    id: 'hono',
    size: 72,
    mobile: false,
    placement: '[--x:-40cqw] [--y:-14cqh] [--r:-7deg]',
  },
  {
    id: 'shadcn-ui',
    size: 96,
    mobile: false,
    placement: '[--x:-32cqw] [--y:4cqh] [--r:6deg]',
  },
  {
    id: 'tanstack',
    size: 56,
    mobile: false,
    placement: '[--x:-42cqw] [--y:22cqh] [--r:-10deg]',
  },
  {
    id: 'better-auth',
    size: 72,
    mobile: false,
    placement: '[--x:-26cqw] [--y:28cqh] [--r:9deg]',
  },
  {
    id: 'resend',
    size: 56,
    mobile: false,
    placement: '[--x:41cqw] [--y:-16cqh] [--r:7deg]',
  },
  {
    id: 'posthog',
    size: 72,
    mobile: false,
    placement: '[--x:30cqw] [--y:-4cqh] [--r:-6deg]',
  },
  {
    id: 'eslint',
    size: 96,
    mobile: false,
    placement: '[--x:40cqw] [--y:12cqh] [--r:11deg]',
  },
  {
    id: 'linear',
    size: 56,
    mobile: false,
    placement: '[--x:26cqw] [--y:28cqh] [--r:-9deg]',
  },
  {
    id: 'cloudflare',
    size: 72,
    mobile: false,
    placement: '[--x:-24cqw] [--y:-26cqh] [--r:5deg]',
  },
  {
    id: 'tailscale',
    size: 56,
    mobile: false,
    placement: '[--x:25cqw] [--y:-24cqh] [--r:-8deg]',
  },
  {
    id: 'github-actions',
    size: 56,
    mobile: false,
    placement: '[--x:-44cqw] [--y:4cqh] [--r:12deg]',
  },
  {
    id: 'remotion',
    size: 72,
    mobile: false,
    placement: '[--x:44cqw] [--y:-34cqh] [--r:-4deg]',
  },
]

/** The five tiles of the end card, each with its tilt. */
export const END_CARD_TILES: readonly EndCardTile[] = [
  { id: 'typescript', tilt: '-rotate-[7deg]' },
  { id: 'astro', tilt: 'rotate-[4deg]' },
  { id: 'react', tilt: '-rotate-[3deg]' },
  { id: 'bun', tilt: 'rotate-[6deg]' },
  { id: 'shadcn-ui', tilt: '-rotate-[5deg]' },
]

/** The 12 tiles spread around the 404 panel, each tipped at its own angle. */
export const NOT_FOUND_TILES: readonly StackTile[] = [
  {
    id: 'typescript',
    size: 72,
    mobile: true,
    placement: '[--x:-36cqw] [--y:-26cqh] [--r:-18deg]',
  },
  {
    id: 'react',
    size: 56,
    mobile: true,
    placement: '[--x:35cqw] [--y:-30cqh] [--r:14deg]',
  },
  {
    id: 'bun',
    size: 56,
    mobile: true,
    placement: '[--x:-42cqw] [--y:10cqh] [--r:22deg]',
  },
  {
    id: 'tailwindcss',
    size: 72,
    mobile: true,
    placement: '[--x:40cqw] [--y:8cqh] [--r:-20deg]',
  },
  {
    id: 'nextjs',
    size: 56,
    mobile: false,
    placement: '[--x:-16cqw] [--y:38cqh] [--r:-27deg]',
  },
  {
    id: 'prisma',
    size: 72,
    mobile: true,
    placement: '[--x:18cqw] [--y:38cqh] [--r:19deg]',
  },
  {
    id: 'claude',
    size: 56,
    mobile: false,
    placement: '[--x:-30cqw] [--y:-6cqh] [--r:11deg]',
  },
  {
    id: 'playwright',
    size: 56,
    mobile: false,
    placement: '[--x:28cqw] [--y:26cqh] [--r:-24deg]',
  },
  {
    id: 'zod',
    size: 56,
    mobile: true,
    placement: '[--x:-10cqw] [--y:-40cqh] [--r:16deg]',
  },
  {
    id: 'supabase',
    size: 72,
    mobile: false,
    placement: '[--x:12cqw] [--y:-38cqh] [--r:-13deg]',
  },
  {
    id: 'docker',
    size: 56,
    mobile: true,
    placement: '[--x:-40cqw] [--y:32cqh] [--r:-15deg]',
  },
  {
    id: 'git',
    size: 56,
    mobile: true,
    placement: '[--x:40cqw] [--y:36cqh] [--r:21deg]',
  },
]

/**
 * Count of tools and tech the Uses page lists.
 * @param locale Language whose Uses data is counted.
 * @returns Tools plus tech badges.
 */
export function stackToolCount(locale: Locale): number {
  return uses[locale].tools.length + uses[locale].tech.length
}
