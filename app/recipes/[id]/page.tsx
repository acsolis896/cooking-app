import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DeleteButton } from './DeleteButton'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login')

  const [recipeResult, ingredientsResult] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, title, servings, prep_minutes, cook_minutes, instructions, photo_path')
      .eq('id', id)
      .single(),
    supabase
      .from('ingredients')
      .select('id, name, quantity, unit, note, position')
      .eq('recipe_id', id)
      .order('position'),
  ])

  if (recipeResult.error || !recipeResult.data) notFound()
  const recipe = recipeResult.data
  const ingredients = ingredientsResult.data ?? []

  // Sign URL for the photo (if any)
  let photoUrl: string | null = null
  if (recipe.photo_path) {
    const { data: signed } = await supabase.storage
      .from('recipe-photos')
      .createSignedUrl(recipe.photo_path, 60 * 60)
    photoUrl = signed?.signedUrl ?? null
  }

  const steps: string[] = Array.isArray(recipe.instructions)
    ? (recipe.instructions as string[])
    : []

  const totalTime = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0)

  return (
    <main className="min-h-dvh bg-white pb-24">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={recipe.title}
          className="h-64 w-full object-cover"
        />
      ) : (
        <div className="flex h-64 w-full items-center justify-center bg-neutral-100 text-6xl text-neutral-300">
          🍳
        </div>
      )}

      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/recipes" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Back
          </Link>
        </div>

        <h1 className="text-2xl font-semibold">{recipe.title}</h1>

        {(recipe.servings || totalTime > 0) && (
          <p className="mt-1 text-sm text-neutral-500">
            {recipe.servings ? `Serves ${recipe.servings}` : ''}
            {recipe.servings && totalTime > 0 ? ' · ' : ''}
            {totalTime > 0 ? `${totalTime} min total` : ''}
          </p>
        )}

        {ingredients.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-medium">Ingredients</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {ingredients.map((ing) => (
                <li key={ing.id} className="flex gap-2">
                  <span className="text-neutral-500">
                    {ing.quantity ?? ''}
                    {ing.quantity && ing.unit ? ' ' : ''}
                    {ing.unit ?? ''}
                  </span>
                  <span>{ing.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {steps.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-medium">Instructions</h2>
            <ol className="mt-2 list-inside list-decimal space-y-2 text-sm">
              {steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-10 border-t border-neutral-200 pt-6">
          <DeleteButton id={recipe.id} />
        </section>
      </div>
    </main>
  )
}