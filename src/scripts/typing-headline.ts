/** Delay between two typed characters, in milliseconds. */
export const TYPE_DELAY_MS = 55

/** Delay between two deleted characters, in milliseconds. */
export const DELETE_DELAY_MS = 28

/** How long the finished phrase stays on screen, in milliseconds. */
export const HOLD_DELAY_MS = 2400

/** How long the empty line waits before typing again, in milliseconds. */
export const PAUSE_DELAY_MS = 600

/** Where the typing loop is: visible characters and direction. */
export interface TypingState {
  length: number
  mode: 'typing' | 'deleting'
}

/** The next state and how long to wait before the one after it. */
export interface TypingStep {
  state: TypingState
  delay: number
}

/**
 * Advances the type, hold, delete, pause loop by one character.
 * @param state The current visible length and direction.
 * @param total Length of the phrase.
 * @returns The new state and the delay before the next step.
 */
export function nextTypingStep(state: TypingState, total: number): TypingStep {
  if (state.mode === 'typing') {
    const length = Math.min(total, state.length + 1)
    return length >= total
      ? { state: { length, mode: 'deleting' }, delay: HOLD_DELAY_MS }
      : { state: { length, mode: 'typing' }, delay: TYPE_DELAY_MS }
  }
  const length = Math.max(0, state.length - 1)
  return length <= 0
    ? { state: { length, mode: 'typing' }, delay: PAUSE_DELAY_MS }
    : { state: { length, mode: 'deleting' }, delay: DELETE_DELAY_MS }
}

/** What the typing loop needs from the browser, injected for tests. */
export interface TypingOptions<Handle> {
  reducedMotion: boolean
  schedule: (callback: () => void, delay: number) => Handle
  cancel: (handle: Handle) => void
}

interface TextTarget {
  textContent: string | null
}

function stopNothing(): void {
  return
}

/**
 * Types a phrase into an element, deletes it and starts over. Under reduced
 * motion it writes the whole phrase once and schedules nothing. The markup
 * already holds the phrase, so without JavaScript nothing changes.
 * @param target The element that shows the typed text.
 * @param phrase The phrase to type.
 * @param options Motion preference and timer functions.
 * @returns A function that stops the loop.
 */
export function startTyping<Handle>(
  target: TextTarget,
  phrase: string,
  options: TypingOptions<Handle>,
): () => void {
  if (options.reducedMotion || phrase.length === 0) {
    target.textContent = phrase
    return stopNothing
  }
  let state: TypingState = { length: 0, mode: 'typing' }
  let handle: Handle | undefined
  const tick = (): void => {
    const step = nextTypingStep(state, phrase.length)
    state = step.state
    target.textContent = phrase.slice(0, state.length)
    handle = options.schedule(tick, step.delay)
  }
  target.textContent = ''
  handle = options.schedule(tick, TYPE_DELAY_MS)
  return () => {
    if (handle !== undefined) options.cancel(handle)
  }
}
