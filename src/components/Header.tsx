import type { ReactNode } from 'react'

import { Link } from '@tanstack/react-router'

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-zinc-800/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-zinc-100">
              knockout
              <span className="text-sky-400">.blue</span>
            </span>
            <span className="hidden text-xs text-zinc-500 lg:inline">World Cup 2026 picks</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/groups/$groupId"
              params={{ groupId: 'A' }}
              className="rounded-md px-2.5 py-1.5 text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Groups
            </Link>
            <Link
              to="/bracket"
              className="rounded-md px-2.5 py-1.5 text-zinc-400 transition-colors hover:text-zinc-100"
              activeProps={{ className: 'text-zinc-100' }}
            >
              Bracket
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  )
}
