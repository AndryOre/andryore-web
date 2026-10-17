import { useState, type ReactElement } from 'react'

import { copyWithFallback, type CopyOutcome } from '@/lib/contact'

import { Button } from './ui/button'

interface CopyEmailButtonCopy {
  copyLabel: string
  copiedMessage: string
  selectedMessage: string
}

interface CopyEmailButtonProps {
  email: string
  targetId: string
  copy: CopyEmailButtonCopy
}

const RESET_DELAY_MS = 2500

const selectElementText = (targetId: string): void => {
  const target = document.querySelector(`#${targetId}`)
  const selection = globalThis.getSelection()
  if (!target || !selection) return
  const range = document.createRange()
  range.selectNodeContents(target)
  selection.removeAllRanges()
  selection.addRange(range)
}

/**
 * Button that copies the contact email, or selects it when the clipboard is
 * unavailable. The result is announced through a polite live region.
 * @param props The email, the id of the element showing it and the labels.
 * @param props.email The address to copy.
 * @param props.targetId Id of the element that shows the address.
 * @param props.copy The button and status labels.
 * @returns The button and its status message.
 */
export default function CopyEmailButton({
  email,
  targetId,
  copy,
}: CopyEmailButtonProps): ReactElement {
  const [outcome, setOutcome] = useState<CopyOutcome | null>(null)

  const handleClick = async (): Promise<void> => {
    const clipboard = globalThis.navigator.clipboard as Clipboard | undefined
    const result = await copyWithFallback(email, {
      writeText: clipboard ? (text) => clipboard.writeText(text) : undefined,
      selectText: () => {
        selectElementText(targetId)
      },
    })
    setOutcome(result)
    setTimeout(() => {
      setOutcome(null)
    }, RESET_DELAY_MS)
  }

  const message =
    outcome === 'copied'
      ? copy.copiedMessage
      : outcome === 'selected'
        ? copy.selectedMessage
        : ''

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          void handleClick()
        }}
      >
        {copy.copyLabel}
      </Button>
      <span role="status" className="text-xs text-muted-foreground">
        {message}
      </span>
    </span>
  )
}
