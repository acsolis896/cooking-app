import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  addDays,
  formatISODate,
  formatWeekRange,
  getMondayOfWeek,
  parseISODate,
} from '@/lib/dates'
import { GenerateButton } from './GenerateButton'
import { GroceryItemRow } from './GroceryItemRow'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<{ week?: string }> }

export default async function GroceriesPage({ searchParams }: PageProps) {
  const { week } = await searchParams
  const monday = week
    ? getMondayOfWeek(parseISODate(week))
    : getMondayOfWeek(new Date())
  const mondayStr = formatISODate(monday)

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login')

  const { data: items, error } = await supabase
    .from('grocery_items')
    .select('id, name, quantity, unit, checked, source_recipe_id')
    .eq('week_start', mondayStr)
    .order('checked')
    .order('name')

  if (error) {
    return (
      <main className="min-h-dvh bg-white px-4 py-6">
        <p className="text-red-700">Error loading groceries: {error.message}</p>
      </main>
    )
  }

  const prevWeek = formatISODate(addDays(monday, -7))
  const nextWeek = formatISODate(addDays(monday, 7))

  return (
    <main className="min-h-dvh bg-white px-4 py-6 pb-24">
      <div className="mx-auto max-w-xl">
        <div className="mb-2">
          <Link href="/" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Home
          </Link>
        </div>

        <h1 className="mb-4 text-2xl font-semibold">Grocery list</h1>

        <div className="mb-6 flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-2 py-2">
          <Link
            href={`/groceries?week=${prevWeek}`}
            className="rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            ← Prev
          </Link>
          <div className="text-sm font-medium">{formatWeekRange(monday)}</div>
          <Link
            href={`/groceries?week=${nextWeek}`}
            className="rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            Next →
          </Link>
        </div>

        <div className="mb-4">
          <GenerateButton week={mondayStr} hasItems={(items ?? []).length > 0} />
        </div>

        {(!items || items.length === 0) ? (
          <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-12 text-center text-sm text-neutral-500">
            <p>No items yet.</p>
            <p className="mt-1">
              Plan some meals and tap Generate.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <GroceryItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}