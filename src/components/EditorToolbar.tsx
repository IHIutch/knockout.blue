import { Dices, Eraser, Wand2 } from 'lucide-react'

import type { AutopickMode } from '../lib/bracket/autopick'

const buttonClass
  = 'flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100'

export function EditorToolbar({
  onAutopick,
  onClear,
  hasPicks,
}: {
  onAutopick: (mode: AutopickMode) => void
  onClear: () => void
  hasPicks: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={buttonClass} onClick={() => onAutopick('chalk')}>
        <Wand2 className="size-3.5" aria-hidden />
        Autopick favorites
      </button>
      <button type="button" className={buttonClass} onClick={() => onAutopick('chaos')}>
        <Dices className="size-3.5" aria-hidden />
        Autopick chaos
      </button>
      {hasPicks && (
        <button
          type="button"
          className={`${buttonClass} text-zinc-400 hover:border-red-900 hover:text-red-300`}
          onClick={onClear}
        >
          <Eraser className="size-3.5" aria-hidden />
          Clear all
        </button>
      )}
    </div>
  )
}
