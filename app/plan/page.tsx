import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RemoveMealButton } from './RemoveMealButton'
import {
  formatDayLabel,
  formatISODate,
  formatWeekRange,
  getMondayOfWeek,
  getWeekDates,
  parseISODate,
  addDays,
} from '@/lib/dates'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<{ week?: string }> }

export default async function PlanPage({ searchParams }: PageProps) {
  const { week } = await searchParams
  const monday = week ? getMondayOfWeek(parseISODate(week)) : getMondayOfWeek(new Date())
  const days = getWeekDates(monday)
  const weekISO = formatISODate(monday)
  const sundayISO = formatISODate(addDays(monday, 6))

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login')

  const { data: meals, error } = await supabase
    .from('meal_plans')
    .select('id, plan_date, slot, recipes (id, title, photo_path)')
    .gte('plan_date', weekISO)
    .lte('plan_date', sundayISO)
    .order('plan_date')
    .order('created_at')

  if (error) {
    return (
      <main className="min-h-dvh bg-white px-4 py-6">
        <p className="text-red-700">Error loading meal plan: {error.message}</p>
      </main>
    )
  }

  // Group meals by date
  const mealsByDate = new Map<string, typeof meals>()
  ;(meals ?? []).forEach((m) => {
    const key = m.plan_date as string
    if (!mealsByDate.has(key)) mealsByDate.set(key, [])
    mealsByDate.get(key)!.push(m)
  })

  // Sign URLs for photos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photoPaths = (meals ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m) => (m.recipes as any)?.photo_path)
    .filter((p): p is string => !!p)
  const signedUrlMap = new Map<string, string>()
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('recipe-photos')
      .createSignedUrls(photoPaths, 60 * 60)
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) signedUrlMap.set(s.path, s.signedUrl)
    })
  }

  const prevWeek = formatISODate(addDays(monday, -7))
  const nextWeek = formatISODate(addDays(monday, 7))

  return (
    <main className="min-h-dvh bg-white px-4 py-6 pb-24">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Home
          </Link>
          <h1 className="text-2xl font-semibold">Meal planner</h1>
          <span className="w-10" />
        </div>

        <div className="mb-6 flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-2 py-2">
          <Link
            href={`/plan?week=${prevWeek}`}
            className="rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            ← Prev
          </Link>
          <div className="text-sm font-medium">{formatWeekRange(monday)}</div>
          <Link
            href={`/plan?week=${nextWeek}`}
            className="rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            Next →
          </Link>
        </div>

        <div className="space-y-4">
          {days.map((day) => {
            const dateISO = formatISODate(day)
            const dayMeals = mealsByDate.get(dateISO) ?? []
            return (
              <section key={dateISO}>
                <h2 className="text-sm font-medium text-neutral-500">
                  {formatDayLabel(day)}
                </h2>
                <div className="mt-2 space-y-2">
                  {dayMeals.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neutral-200 px-3 py-3 text-sm text-neutral-400">
                      No meals planned
                    </div>
                  ) : (
                    dayMeals.map((m) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const recipe = m.recipes as any
                    const photoUrl = recipe?.photo_path
                        ? signedUrlMap.get(recipe.photo_path)
                        : null
                    return (
                        <div
                        key={m.id}
                        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2"
                        >
                        <Link
                            href={recipe?.id ? `/recipes/${recipe.id}` : '/recipes'}
                            className="flex min-w-0 flex-1 items-center gap-3"
                        >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                            {photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                src={photoUrl}
                                alt={recipe.title}
                                className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xl text-neutral-300">
                                🍳
                                </div>
                            )}
                            </div>
                            <div className="min-w-0 flex-1 truncate text-sm font-medium">
                            {recipe?.title ?? 'Untitled'}
                            </div>
                        </Link>
                        <RemoveMealButton id={m.id} />
                        </div>
                    )
                    })
                  )}
                  <Link
                    href={`/plan/add?date=${dateISO}&week=${weekISO}`}
                    className="block rounded-lg border border-dashed border-green-300 px-3 py-2 text-center text-sm font-medium text-green-700 hover:bg-green-50"
                  >
                    + Add meal
                  </Link>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}