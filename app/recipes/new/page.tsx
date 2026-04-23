'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type Ingredient = {
  name: string
  quantity: string
  unit: string
}

export default function NewRecipePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [servings, setServings] = useState('')
  const [prepMinutes, setPrepMinutes] = useState('')
  const [cookMinutes, setCookMinutes] = useState('')
  const [instructionsText, setInstructionsText] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: '', unit: '' },
  ])

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
      setPhotoPreview(null)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) throw new Error('Not logged in')
      const userId = userData.user.id

      // 1. Insert the recipe row (without photo_path yet)
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: userId,
          title: title.trim(),
          servings: servings ? Number(servings) : null,
          prep_minutes: prepMinutes ? Number(prepMinutes) : null,
          cook_minutes: cookMinutes ? Number(cookMinutes) : null,
          instructions: instructionsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        })
        .select()
        .single()
      if (recipeError || !recipe) throw new Error(recipeError?.message ?? 'Failed to save recipe')

      // 2. Upload photo (if provided)
      let photoPath: string | null = null
      if (photoFile) {
        const ext = (photoFile.name.split('.').pop() ?? 'jpg').toLowerCase()
        const path = `${userId}/${recipe.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('recipe-photos')
          .upload(path, photoFile, {
            upsert: true,
            contentType: photoFile.type || 'image/jpeg',
          })
        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)
        photoPath = path

        // Save the path onto the recipe
        const { error: updateError } = await supabase
          .from('recipes')
          .update({ photo_path: photoPath })
          .eq('id', recipe.id)
        if (updateError) throw new Error(updateError.message)
      }

      // 3. Insert ingredients
      const ingredientRows = ingredients
        .filter((ing) => ing.name.trim())
        .map((ing, position) => ({
          recipe_id: recipe.id,
          name: ing.name.trim(),
          quantity: ing.quantity ? Number(ing.quantity) : null,
          unit: ing.unit.trim() || null,
          position,
        }))

      if (ingredientRows.length > 0) {
        const { error: ingError } = await supabase.from('ingredients').insert(ingredientRows)
        if (ingError) throw new Error(ingError.message)
      }

      router.push('/recipes')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <main className="min-h-dvh bg-white px-4 py-6 pb-24">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Add recipe</h1>
          <Link href="/recipes" className="text-sm text-neutral-600 hover:text-neutral-900">
            Cancel
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Title */}
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

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">Photo</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPhotoChange}
              className="mt-1 block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-neutral-800"
            />
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Preview"
                className="mt-3 h-48 w-full rounded-lg object-cover"
              />
            )}
          </div>

          {/* Meta */}
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

          {/* Ingredients */}
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

          {/* Instructions */}
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
            {saving ? 'Saving...' : 'Save recipe'}
          </button>
        </form>
      </div>
    </main>
  )
}