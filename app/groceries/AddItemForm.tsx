'use client'

import { useRef, useTransition } from 'react'
import { addManualItem } from './actions'

export function AddItemForm({ week }: { week: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await addManualItem(formData)
      formRef.current?.reset()
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex gap-2 rounded-lg border border-neutral-200 bg-white p-2"
    >
      <input type="hidden" name="week" value={week} />
      <input
        type="text"
        name="quantity"
        inputMode="decimal"
        placeholder="Qty"
        className="w-14 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
      />
      <input
        type="text"
        name="unit"
        placeholder="Unit"
        className="w-16 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
      />
      <input
        type="text"
        name="name"
        required
        placeholder="Add item..."
        className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? '...' : 'Add'}
      </button>
    </form>
  )
}