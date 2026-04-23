import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login')

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, servings, prep_minutes, cook_minutes, photo_path, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="min-h-dvh bg-white px-4 py-6">
        <p className="text-red-700">Error loading recipes: {error.message}</p>
      </main>
    )
  }

  // Sign URLs for all photos in one batch (only for recipes that have a photo)
  const photoPaths = (recipes ?? []).map((r) => r.photo_path).filter((p): p is string => !!p)
  const signedUrlMap = new Map<string, string>()
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('recipe-photos')
      .createSignedUrls(photoPaths, 60 * 60) // 1 hour
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) signedUrlMap.set(s.path, s.signedUrl)
    })
  }

  return (
    <main className="min-h-dvh bg-white px-4 py-6 pb-24">
      <div className="mx-auto max-w-xl">
        <div className="mb-2">
        <Link href="/" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Home
        </Link>
        </div>
        <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My recipes</h1>
        <Link
            href="/recipes/new"
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
            + Add
        </Link>
        </div>

        {(!recipes || recipes.length === 0) ? (
          <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-12 text-center text-neutral-500">
            <p>No recipes yet.</p>
            <Link
              href="/recipes/new"
              className="mt-3 inline-block text-sm font-medium text-green-700 hover:text-green-800"
            >
              Add your first one →
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {recipes.map((r) => {
              const photoUrl = r.photo_path ? signedUrlMap.get(r.photo_path) : null
              return (
                <li key={r.id}>
                  <Link
                    href={`/recipes/${r.id}`}
                    className="block overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-neutral-300 hover:shadow-sm"
                  >
                    <div className="aspect-square w-full bg-neutral-100">
                      {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoUrl}
                          alt={r.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl text-neutral-300">
                          🍳
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h2 className="truncate text-sm font-medium">{r.title}</h2>
                      {(r.prep_minutes || r.cook_minutes) && (
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {(r.prep_minutes ?? 0) + (r.cook_minutes ?? 0)} min
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}