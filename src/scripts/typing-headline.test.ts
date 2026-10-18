import { describe, expect, test } from 'bun:test'

import {
  DELETE_DELAY_MS,
  HOLD_DELAY_MS,
  nextTypingStep,
  PAUSE_DELAY_MS,
  startTyping,
  TYPE_DELAY_MS,
  type TypingState,
} from './typing-headline'

function noop(): void {
  return
}

const PHRASE = 'abc'

const run = (steps: number): { lengths: number[]; delays: number[] } => {
  let state: TypingState = { length: 0, mode: 'typing' }
  const lengths: number[] = []
  const delays: number[] = []
  for (let index = 0; index < steps; index += 1) {
    const step = nextTypingStep(state, PHRASE.length)
    state = step.state
    lengths.push(state.length)
    delays.push(step.delay)
  }
  return { lengths, delays }
}

describe('nextTypingStep', () => {
  test('types one character at a time and holds when the phrase is full', () => {
    const { lengths, delays } = run(3)
    expect(lengths).toEqual([1, 2, 3])
    expect(delays).toEqual([TYPE_DELAY_MS, TYPE_DELAY_MS, HOLD_DELAY_MS])
  })

  test('deletes after the hold and pauses once empty', () => {
    const { lengths, delays } = run(6)
    expect(lengths).toEqual([1, 2, 3, 2, 1, 0])
    expect(delays.slice(3)).toEqual([
      DELETE_DELAY_MS,
      DELETE_DELAY_MS,
      PAUSE_DELAY_MS,
    ])
  })

  test('starts typing again after the pause', () => {
    expect(run(7).lengths.at(-1)).toBe(1)
  })
})

describe('startTyping', () => {
  const phrase = 'I build things'

  test('under reduced motion it shows the whole phrase and schedules nothing', () => {
    const target = { textContent: '' }
    let scheduled = 0
    const stop = startTyping(target, phrase, {
      reducedMotion: true,
      schedule: () => {
        scheduled += 1
        return 0
      },
      cancel: noop,
    })
    expect(target.textContent).toBe(phrase)
    expect(scheduled).toBe(0)
    stop()
  })

  test('types from empty, one prefix at a time, until stopped', () => {
    const target = { textContent: phrase }
    const queue: (() => void)[] = []
    const cancelled: number[] = []
    const stop = startTyping(target, phrase, {
      reducedMotion: false,
      schedule: (callback) => {
        queue.push(callback)
        return queue.length
      },
      cancel: (handle) => {
        cancelled.push(handle)
      },
    })
    expect(target.textContent).toBe('')
    queue.shift()?.()
    expect(target.textContent).toBe('I')
    queue.shift()?.()
    expect(target.textContent).toBe('I ')
    stop()
    expect(cancelled).toHaveLength(1)
  })
})
