/** One row of the Uses list. */
interface UsesRow {
  label: string
  value: string
  url?: string
  affiliate: boolean
  sample: boolean
}

/** A named group of Uses rows. */
export interface UsesCategory {
  name: string
  rows: readonly UsesRow[]
}

/** A decorative icon of the floating field and where it sits. */
export interface FieldIcon {
  id: string
  placement: string
}

/**
 * The decorative icons floating over the Uses title. The positions are
 * literal classes because the CSP forbids inline styles.
 */
export const FIELD_ICONS: readonly FieldIcon[] = [
  { id: 'keyboard', placement: 'top-[8%] left-[6%]' },
  { id: 'monitor', placement: 'top-[14%] left-[30%]' },
  { id: 'mouse', placement: 'top-[6%] left-[56%]' },
  { id: 'headphones', placement: 'top-[18%] right-[8%]' },
  { id: 'microphone', placement: 'top-[44%] left-[12%]' },
  { id: 'camera', placement: 'top-[48%] left-[44%]' },
  { id: 'laptop', placement: 'top-[42%] right-[22%]' },
  { id: 'terminal', placement: 'bottom-[10%] left-[24%]' },
  { id: 'cup', placement: 'bottom-[8%] left-[62%]' },
  { id: 'chip', placement: 'bottom-[14%] right-[6%]' },
]

const FLOAT_CLASSES = ['uses-float-6', 'uses-float-7', 'uses-float-8'] as const

/**
 * Float animation of the icon at `index`. The three floats last 6, 7 and 8
 * seconds so neighbouring icons never move in step.
 * @param index Position of the icon in the field.
 * @returns A literal `uses-float-N` class the stylesheet defines.
 */
export function floatClass(index: number): (typeof FLOAT_CLASSES)[number] {
  const step = Math.max(0, Math.floor(index))
  return FLOAT_CLASSES[step % FLOAT_CLASSES.length] ?? 'uses-float-6'
}

/**
 * Whether the page must carry its affiliate disclosure.
 * @param categories The Uses categories of one language.
 * @returns True when at least one row is an affiliate link.
 */
export function hasAffiliateRows(categories: readonly UsesCategory[]): boolean {
  return categories.some((category) =>
    category.rows.some((row) => row.affiliate),
  )
}
