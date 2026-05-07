import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecipeForm, type RecipeFormInitial } from '../../RecipeForm'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

export default async function EditRecipePage({ params }: PageProps) {
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
      .select('name, quantity, unit, position')
      .eq('recipe_id', id)
      .order('position'),
  ])

  if (recipeResult.error || !recipeResult.data) notFound()
  const recipe = recipeResult.data
  const ingredients = ingredientsResult.data ?? []

  let photoUrl: string | null = null
  if (recipe.photo_path) {
    const { data: signed } = await supabase.storage
      .from('recipe-photos')
      .createSignedUrl(recipe.photo_path, 60 * 60)
    photoUrl = signed?.signedUrl ?? null
  }

  const initial: RecipeFormInitial = {
    id: recipe.id,
    title: recipe.title,
    servings: recipe.servings,
    prep_minutes: recipe.prep_minutes,
    cook_minutes: recipe.cook_minutes,
    instructions: Array.isArray(recipe.instructions)
      ? (recipe.instructions as string[])
      : [],
    photoUrl,
    ingredients: ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
    })),
  }

  return <RecipeForm mode="edit" initial={initial} />
}