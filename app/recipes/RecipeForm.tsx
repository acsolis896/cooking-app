'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { processImageForUpload } from '@/lib/image'

type Ingredient = {
  name: string
  quantity: string
  unit: string
}

export type RecipeFormInitial = {
  id: string
  title: string
  servings: number | null
  prep_minutes: number | null
  cook_minutes: number | null
  instructions: string[]
  photoUrl: string | null
  ingredients: { name: string; quantity: number | null; unit: string | null }[]
}

type Props = {
  mode: 'create' | 'edit'
  initial?: RecipeFormInitial
}

export function RecipeForm({ mode, initial }: Props) {
  const router = useRouter()
  const isEdit = mode === 'edit'
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState<string>(
    isEdit ? 'Save changes' : 'Save recipe'
  )

  const [title, setTitle] = useState(initial?.title ?? '')
  const [servings, setServings] = useState(
    initial?.servings != null ? String(initial.servings) : ''
  )
  const [prepMinutes, setPrepMinutes] = useState(
    initial?.prep_minutes != null ? String(initial.prep_minutes) : ''
  )
  const [cookMinutes, setCookMinutes] = useState(
    initial?.cook_minutes != null ? String(initial.cook_minutes) : ''
  )
  const [instructionsText, setInstructionsText] = useState(
    (initial?.instructions ?? []).join('\n')
  )
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initial?.photoUrl ?? null
  )
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial && initial.ingredients.length > 0
      ? initial.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity != null ? String(ing.quantity) : '',
          unit: ing.unit ?? '',
        }))
      : [{ name: '', quantity: '', unit: '' }]
  )

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    )
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }])
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhotoFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
    } else {
      setPhotoPreview(initial?.photoUrl ?? null)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    setStatusText(isEdit ? 'Saving changes...' : 'Saving recipe...')

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) throw new Error('Not logged in')
      const userId = userData.user.id

      const recipeFields = {
        title: title.trim(),
        servings: servings ? Number(servings) : null,
        prep_minutes: prepMinutes ? Number(prepMinutes) : null,
        cook_minutes: cookMinutes ? Number(cookMinutes) : null,
        instructions: instructionsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      }

      let recipeId: string

      if (isEdit) {
        if (!initial?.id) throw new Error('Missing recipe id for edit')
        recipeId = initial.id
        const { error: updateError } = await supabase
          .from('recipes')
          .update(recipeFields)
          .eq('id', recipeId)
        if (updateError) throw new Error(updateError.message)
      } else {
        const { data: recipe, error: recipeError } = await supabase
          .from('recipes')
          .insert({ user_id: userId, ...recipeFields })
          .select()
          .single()
        if (recipeError || !recipe)
          throw new Error(recipeError?.message ?? 'Failed to save recipe')
        recipeId = recipe.id
      }

      // Photo (if a new one was picked)
      if (photoFile) {
        setStatusText('Processing photo...')
        const processedBlob = await processImageForUpload(photoFile)

        setStatusText('Uploading photo...')
        const path = `${userId}/${recipeId}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('recipe-photos')
          .upload(path, processedBlob, {
            upsert: true,
            contentType: 'image/jpeg',
          })
        if (uploadError)
          throw new Error(`Photo upload failed: ${uploadError.message}`)

        setStatusText(isEdit ? 'Saving changes...' : 'Saving recipe...')
        const { error: photoUpdateError } = await supabase
          .from('recipes')
          .update({ photo_path: path })
          .eq('id', recipeId)
        if (photoUpdateError) throw new Error(photoUpdateError.message)
      }

      // Ingredients: in edit mode, replace the whole set
      if (isEdit) {
        const { error: deleteError } = await supabase
          .from('ingredients')
          .delete()
          .eq('recipe_id', recipeId)
        if (deleteError) throw new Error(deleteError.message)
      }

      const ingredientRows = ingredients
        .filter((ing) => ing.name.trim())
        .map((ing, position) => ({
          recipe_id: recipeId,
          name: ing.name.trim(),
          quantity: ing.quantity ? Number(ing.quantity) : null,
          unit: ing.unit.trim() || null,
          position,
        }))

      if (ingredientRows.length > 0) {
        const { error: ingError } = await supabase
          .from('ingredients')
          .insert(ingredientRows)
        if (ingError) throw new Error(ingError.message)
      }

      router.push(isEdit ? `/recipes/${recipeId}` : '/recipes')
      router.refresh()
    } catch (err) {
      console.error('Save recipe failed:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
      setStatusText(isEdit ? 'Save changes' : 'Save recipe')
    }
  }

  const cancelHref = isEdit && initial?.id ? `/recipes/${initial.id}` : '/recipes'

  return (
    <main className="min-h-dvh bg-white px-4 py-6 pb-24">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            {isEdit ? 'Edit recipe' : 'Add recipe'}
          </h1>
          <Link
            href={cancelHref}
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            Cancel
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Grandma's lasagna"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
              className="mt-1 block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-neutral-800"
            />
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Preview"
                className="mt-3 h-48 w-full rounded-lg object-cover"
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Servings</label>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Prep (min)</label>
              <input
                type="number"
                min="0"
                value={prepMinutes}
                onChange={(e) => setPrepMinutes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Cook (min)</label>
              <input
                type="number"
                min="0"
                value={cookMinutes}
                onChange={(e) => setCookMinutes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Ingredients</label>
            <div className="mt-2 space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Qty"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                    className="w-16 rounded-lg border border-neutral-300 px-2 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                    className="w-20 rounded-lg border border-neutral-300 px-2 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Ingredient"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-300 px-2 py-2 text-sm"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className="rounded-lg px-2 text-neutral-500 hover:bg-neutral-100"
                      aria-label="Remove ingredient"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="mt-2 text-sm font-medium text-green-700 hover:text-green-800"
            >
              + Add ingredient
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Instructions
              <span className="ml-2 text-xs font-normal text-neutral-500">
                (one step per line)
              </span>
            </label>
            <textarea
              rows={6}
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              placeholder={'Preheat oven to 375°F\nMix the dry ingredients\n...'}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? statusText : isEdit ? 'Save changes' : 'Save recipe'}
          </button>
        </form>
      </div>
    </main>
  )
}