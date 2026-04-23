import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDayLabel, parseISODate } from '@/lib/dates'
import { addMealToPlan } from '../actions'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<{ date?: string; week?: string }> }

export default async function AddMealPage({ searchParams }: PageProps) {
  const { date, week } = await searchParams
  if (!date || !week) redirect('/plan')

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login')

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, photo_path')
    .order('title')

  if (error) {
    return (
      <main className="min-h-dvh bg-white px-4 py-6">
        <p className="text-red-700">Error loading recipes: {error.message}</p>
      </main>
    )
  }

  const photoPaths = (recipes ?? []).map((r) => r.photo_path).filter((p): p is string => !!p)
  const signedUrlMap = new Map<string, string>()
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('recipe-photos')
      .createSignedUrls(photoPaths, 60 * 60)
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) signedUrlMap.set(s.path, s.signedUrl)
    })
  }

  const day = parseISODate(date)

  return (
    <main className="min-h-dvh bg-white px-4 py-6 pb-24">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/plan?week=${week}`}
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            ← Back
          </Link>
        </div>

        <h1 className="text-xl font-semibold">Pick a recipe</h1>
        <p className="mt-1 text-sm text-neutral-500">for {formatDayLabel(day)}</p>

        {(!recipes || recipes.length === 0) ? (
          <div className="mt-6 rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500">
            <p>You don&apos;t have any recipes yet.</p>
            <Link
              href="/recipes/new"
              className="mt-2 inline-block font-medium text-green-700 hover:text-green-800"
            >
              Add your first one →
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-2">
            {recipes.map((r) => {
              const photoUrl = r.photo_path ? signedUrlMap.get(r.photo_path) : null
              return (
                <li key={r.id}>
                  <form action={addMealToPlan}>
                    <input type="hidden" name="recipe_id" value={r.id} />
                    <input type="hidden" name="plan_date" value={date} />
                    <input type="hidden" name="week" value={week} />
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2 text-left hover:border-neutral-300 hover:shadow-sm"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoUrl}
                            alt={r.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl text-neutral-300">
                            🍳
                          </div>
                        )}
                      </div>
                      <div className="flex-1 truncate text-sm font-medium">{r.title}</div>
                    </button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}