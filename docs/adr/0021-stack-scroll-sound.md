# 0021: Stack scene scroll sound

## Status

Accepted. Amends [0019](0019-optional-interface-sound.md) for the Stack scene
only.

Date: 2026-10-19

## Context

[0019](0019-optional-interface-sound.md) says nothing plays on scroll. The Stack
scene ("What I build with") is a scroll-driven animation: the tiles converge
into a closing card over a pinned stretch of the page. Sound tied to that motion
makes it feel physical, and the Glass pack already holds the two sounds it
needs.

## Decision

- **One scene, one exception.** Only the Stack scene may play on scroll. Every
  other rule of 0019 stands: Sound is optional and off by default, the volume is
  fixed, and the audio files stay private.
- **Ticks while the tiles converge.** A soft `click` (gain about 0.12) plays on
  each change of a tick index that maps scene progress over the converge range
  (0 to about 0.64) to the number of visible tiles (24, or 12 at 40rem and
  below). The pitch rises linearly from 0.9 to 1.4. Ticks play in either scroll
  direction, at most one every 45 ms. A fast scroll drops ticks; they are never
  queued.
- **One settle pop.** A `pop` (gain about 0.8, rate 0.85) plays when progress
  crosses about 0.72, once per forward pass, and re-arms after progress drops
  below about 0.6.
- **Gates, all required.** Sound is on, the AudioContext was already unlocked by
  an earlier click or key press, the tab is visible, `prefers-reduced-motion` is
  not `reduce`, and `animation-timeline` is supported. If any gate fails,
  nothing plays. Scroll never unlocks audio.
- **No new files.** The scene reuses `click` and `pop`; `SOUND_FILES` and the
  manifest do not change.
- **Cheap to run.** Progress comes from `getBoundingClientRect` in a passive
  scroll listener coalesced with `requestAnimationFrame`, attached only while an
  `IntersectionObserver` reports the scene near the viewport.

### Rejected alternatives

- **Sound on every scroll animation**: the Site has one such scene, and a
  general rule would invite noise elsewhere.
- **Unlocking audio on scroll**: browsers do not count scroll as a gesture, and
  unexpected audio is hostile.

## Consequences

- The sound engine gains two events and an optional per-call playback rate.
- The Stack scene gains a small client script with its own test.
- A visitor with Sound off, reduced motion or no scroll timelines hears nothing
  and the script does no work.
