import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RecipesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, servings, prep_minutes, cook_minutes, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen p-6 bg-zinc-50">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My recipes</h1>
          <Link
            href="/recipes/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm"
          >
            + Add
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4">
            Couldn&apos;t load recipes: {error.message}
          </p>
        )}

        {recipes && recipes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-600 mb-4">No recipes yet.</p>
            <Link
              href="/recipes/new"
              className="text-green-700 font-medium"
            >
              Add your first recipe →
            </Link>
          </div>
        )}

        {recipes && recipes.length > 0 && (
          <ul className="space-y-3">
            {recipes.map((r) => (
            <li key={r.id}>
                <Link
                    href={`/recipes/${r.id}`}
                    className="block p-4 bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 transition"
                >
                  <h2 className="font-semibold text-lg">{r.title}</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    {[
                      r.servings ? `${r.servings} servings` : null,
                      r.prep_minutes ? `${r.prep_minutes} min prep` : null,
                      r.cook_minutes ? `${r.cook_minutes} min cook` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'No details'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-zinc-500">
            ← Home
          </Link>
        </div>
      </div>
    </div>
  )
}