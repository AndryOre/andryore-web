import {
  getFxStorage,
  readFx,
  subscribeFx,
  writeFx,
  type FxStorage,
} from '../lib/fx-store'

/** The parts of the switch element the script touches, so tests can fake it. */
export interface FxSwitchElement {
  setAttribute: (name: string, value: string) => void
  addEventListener: (type: 'click', listener: () => void) => void
}

/**
 * Reflects the stored Sound choice on the switch and toggles it on click.
 * No audio plays here; the choice is only stored for the sound engine.
 * @param element Element that carries `role="switch"`.
 * @param storage The storage to use; defaults to `localStorage` when usable.
 */
export function mountFxSwitch(
  element: FxSwitchElement,
  storage: FxStorage | undefined = getFxStorage(),
): void {
  const paint = (): void => {
    element.setAttribute('aria-checked', String(readFx(storage)))
  }
  paint()
  subscribeFx(paint)
  element.addEventListener('click', () => {
    writeFx(storage, !readFx(storage))
  })
}
