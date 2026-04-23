'use client'

import { useTransition } from 'react'
import { removeGroceryItem, toggleGroceryItem } from './actions'

type Props = {
  item: {
    id: string
    name: string
    quantity: number | null
    unit: string | null
    checked: boolean
    source_recipe_id: string | null
  }
}

export function GroceryItemRow({ item }: Props) {
  const [togglePending, startToggle] = useTransition()
  const [removePending, startRemove] = useTransition()
  const pending = togglePending || removePending

  function onToggle() {
    startToggle(() => {
      toggleGroceryItem(item.id, !item.checked)
    })
  }

  function onRemove() {
    startRemove(() => {
      removeGroceryItem(item.id)
    })
  }

  return (
    <li className={`flex items-center gap-2 rounded-lg px-2 hover:bg-neutral-50 ${
      pending ? 'opacity-50' : ''
    }`}>
      <label className="flex flex-1 cursor-pointer items-center gap-3 py-2">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={onToggle}
          disabled={pending}
          className="h-5 w-5 rounded border-neutral-300 accent-green-600"
        />
        <span
          className={`flex-1 text-sm ${
            item.checked ? 'text-neutral-400 line-through' : ''
          }`}
        >
          {item.quantity != null && (
            <span className="text-neutral-500">
              {formatQuantity(item.quantity)}{' '}
            </span>
          )}
          {item.unit && <span className="text-neutral-500">{item.unit} </span>}
          {item.name}
        </span>
      </label>
      <button
        type="button"
        onClick={onRemove}
        disabled={pending}
        aria-label="Remove item"
        className="shrink-0 rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
      >
        ✕
      </button>
    </li>
  )
}

function formatQuantity(q: number): string {
  if (Math.abs(q - Math.round(q)) < 0.01) return String(Math.round(q))
  return String(Number(q.toFixed(2)))
}