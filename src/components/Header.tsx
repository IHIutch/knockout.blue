import type { ReactNode } from 'react'

import { Link } from '@tanstack/react-router'

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-zinc-800/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-zinc-100">
            bracket
            <span className="text-sky-400">.blue</span>
          </span>
          <span className="hidden text-xs text-zinc-500 sm:inline">World Cup 2026 picks</span>
        </Link>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  )
}
