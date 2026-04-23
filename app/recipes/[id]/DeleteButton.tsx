'use client'

import { useTransition } from 'react'
import { deleteRecipe } from './actions'

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!window.confirm('Delete this recipe? This cannot be undone.')) return
    startTransition(() => {
      deleteRecipe(id)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-sm text-red-600 font-medium disabled:opacity-50"
    >
      {pending ? 'Deleting...' : 'Delete recipe'}
    </button>
  )
}