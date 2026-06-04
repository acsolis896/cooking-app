'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  matches: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: <HomeIcon />,
    matches: (p) => p === '/',
  },
  {
    label: 'Recipes',
    href: '/recipes',
    icon: <BookIcon />,
    matches: (p) => p.startsWith('/recipes'),
  },
  {
    label: 'Plan',
    href: '/plan',
    icon: <CalendarIcon />,
    matches: (p) => p.startsWith('/plan'),
  },
  {
    label: 'Groceries',
    href: '/groceries',
    icon: <CartIcon />,
    matches: (p) => p.startsWith('/groceries'),
  },
]

const HIDDEN_PREFIXES = ['/login', '/signup', '/auth']

export function BottomNav() {
  const pathname = usePathname()
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-xl">
        {NAV_ITEMS.map((item) => {
          const active = item.matches(pathname)
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 ${
                  active ? 'text-green-700' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span className="h-6 w-6">{item.icon}</span>
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// Simple inline SVG icons (Lucide-style, no library needed)
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}