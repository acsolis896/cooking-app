'use client'

import { useRouter } from 'next/navigation'

export function BackButton({ fallbackHref = '/' }: { fallbackHref?: string }) {
  const router = useRouter()

  function onClick() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-neutral-600 hover:text-neutral-900"
    >
      ← Back
    </button>
  )
}