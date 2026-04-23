'use client'

import { useTransition } from 'react'
import { removeMealFromPlan } from './actions'

export function RemoveMealButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  function onClick() {
    startTransition(() => {
      removeMealFromPlan(id)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label="Remove meal"
      className="shrink-0 rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
    >
      {pending ? '...' : '✕'}
    </button>
  )
}