import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DeleteButton } from './DeleteButton'

type PageProps = { params: Promise<{ id: string }> }

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch recipe and ingredients in parallel
  const [recipeResult, ingredientsResult] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, title, servings, prep_minutes, cook_minutes, instructions, created_at')
      .eq('id', id)
      .single(),
    supabase
      .from('ingredients')
      .select('id, name, quantity, unit, note, position')
      .eq('recipe_id', id)
      .order('position', { ascending: true }),
  ])

  if (recipeResult.error || !recipeResult.data) {
    notFound()
  }

  const recipe = recipeResult.data
  const ingredients = ingredientsResult.data ?? []
  const steps: string[] = Array.isArray(recipe.instructions)
    ? (recipe.instructions as string[])
    : []

  const metaLine = [
    recipe.servings ? `${recipe.servings} servings` : null,
    recipe.prep_minutes ? `${recipe.prep_minutes} min prep` : null,
    recipe.cook_minutes ? `${recipe.cook_minutes} min cook` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="min-h-screen p-6 bg-zinc-50">
      <div className="max-w-xl mx-auto">
        <div className="mb-4">
          <Link href="/recipes" className="text-sm text-zinc-500">
            ← All recipes
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-1">{recipe.title}</h1>
        {metaLine && <p className="text-sm text-zinc-500 mb-6">{metaLine}</p>}

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Ingredients</h2>
          {ingredients.length === 0 ? (
            <p className="text-sm text-zinc-500">No ingredients listed.</p>
          ) : (
            <ul className="space-y-1">
              {ingredients.map((ing) => (
                <li key={ing.id} className="flex gap-2 text-zinc-800">
                  <span className="text-zinc-500 w-24 shrink-0">
                    {[ing.quantity, ing.unit].filter(Boolean).join(' ') || '—'}
                  </span>
                  <span>{ing.name}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Instructions</h2>
          {steps.length === 0 ? (
            <p className="text-sm text-zinc-500">No instructions listed.</p>
          ) : (
            <ol className="space-y-3 list-decimal list-outside pl-5">
              {steps.map((step, i) => (
                <li key={i} className="text-zinc-800 leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="pt-4 border-t border-zinc-200">
          <DeleteButton id={recipe.id} />
        </div>
        
      </div>
    </div>
  )
}