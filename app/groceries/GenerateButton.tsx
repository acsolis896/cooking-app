'use client'

import { useTransition } from 'react'
import { generateGroceryList } from './actions'

type Props = { week: string; hasItems: boolean }

export function GenerateButton({ week, hasItems }: Props) {
  const [pending, startTransition] = useTransition()

  function onClick() {
    startTransition(() => {
      generateGroceryList(week)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
    >
      {pending
        ? 'Generating...'
        : hasItems
          ? 'Regenerate from meal plan'
          : 'Generate from meal plan'}
    </button>
  )
}