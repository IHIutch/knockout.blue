import { Link } from '@tanstack/react-router'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { WinnersMap } from '../lib/bracket/schema'
import { publishBracket } from '../server/auth'
import { AuthButton } from './AuthButton'

/** The right side of the PublishBar: sign-in prompt → publish → share link. */
export function PublishAction({ winners, picksMade }: { winners: WinnersMap; picksMade: number }) {
  const { state } = useAuth()
  const [phase, setPhase] = useState<'idle' | 'publishing' | 'done' | 'error'>('idle')
  const [copied, setCopied] = useState(false)

  if (state.status === 'loading') return null
  if (state.status === 'anonymous') {
    return <AuthButton label="Sign in to publish" panelDirection="up" />
  }

  const shareUrl = `${window.location.origin}/b/${state.handle}`

  const publish = async () => {
    setPhase('publishing')
    try {
      await publishBracket({ data: winners })
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (phase === 'done') {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/b/$handle"
          params={{ handle: state.handle }}
          className="rounded-lg border border-sky-700 px-3 py-1.5 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-950"
        >
          View
        </Link>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button
          type="button"
          onClick={() => setPhase('idle')}
          className="text-xs text-zinc-500 underline-offset-2 hover:underline"
        >
          Edit more
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {phase === 'error' && <span className="text-xs text-red-400">Publish failed — try again</span>}
      <button
        type="button"
        disabled={phase === 'publishing' || picksMade === 0}
        onClick={() => void publish()}
        className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
      >
        {phase === 'publishing' ? 'Publishing…' : 'Publish'}
      </button>
    </div>
  )
}
