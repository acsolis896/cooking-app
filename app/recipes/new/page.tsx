'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type Ingredient = { name: string; quantity: string; unit: string }

export default function NewRecipePage() {
  const router = useRouter()

  // Basic fields
  const [title, setTitle] = useState('')
  const [servings, setServings] = useState('')
  const [prepMinutes, setPrepMinutes] = useState('')
  const [cookMinutes, setCookMinutes] = useState('')
  const [instructions, setInstructions] = useState('')

  // Dynamic ingredient list
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: '', unit: '' },
  ])

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }])
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // Split instructions textarea into an array of steps (one per non-empty line)
    const steps = instructions
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    // Get current user id (needed for the insert because of RLS)
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setError('You must be signed in.')
      setSaving(false)
      return
    }

    // 1. Insert the recipe row
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: userData.user.id,
        title,
        servings: servings ? Number(servings) : null,
        prep_minutes: prepMinutes ? Number(prepMinutes) : null,
        cook_minutes: cookMinutes ? Number(cookMinutes) : null,
        instructions: steps,
      })
      .select()
      .single()

    if (recipeError || !recipe) {
      setError(recipeError?.message ?? 'Failed to save recipe.')
      setSaving(false)
      return
    }

    // 2. Insert the ingredient rows (only ones with a name)
    const ingredientRows = ingredients
      .filter((i) => i.name.trim() !== '')
      .map((i, idx) => ({
        recipe_id: recipe.id,
        name: i.name.trim(),
        quantity: i.quantity ? Number(i.quantity) : null,
        unit: i.unit.trim() || null,
        position: idx,
      }))

    if (ingredientRows.length > 0) {
      const { error: ingError } = await supabase
        .from('ingredients')
        .insert(ingredientRows)
      if (ingError) {
        setError(`Recipe saved, but ingredients failed: ${ingError.message}`)
        setSaving(false)
        return
      }
    }

    router.push('/recipes')
    router.refresh()
  }

  return (
    <div className="min-h-screen p-6 bg-zinc-50">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Add recipe</h1>
          <Link href="/recipes" className="text-sm text-zinc-600">
            Cancel
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg bg-white"
            />
          </div>

          {/* Servings + timing */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Servings</label>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-full px-3 py-3 border border-zinc-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prep (min)</label>
              <input
                type="number"
                min="0"
                value={prepMinutes}
                onChange={(e) => setPrepMinutes(e.target.value)}
                className="w-full px-3 py-3 border border-zinc-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cook (min)</label>
              <input
                type="number"
                min="0"
                value={cookMinutes}
                onChange={(e) => setCookMinutes(e.target.value)}
                className="w-full px-3 py-3 border border-zinc-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium mb-2">Ingredients</label>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Qty"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                    className="w-16 px-2 py-2 border border-zinc-300 rounded-lg bg-white text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    className="w-20 px-2 py-2 border border-zinc-300 rounded-lg bg-white text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Ingredient"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="px-2 text-zinc-500 hover:text-red-600"
                    aria-label="Remove ingredient"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="mt-2 text-sm text-green-700 font-medium"
            >
              + Add ingredient
            </button>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Instructions <span className="text-zinc-500">(one step per line)</span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg bg-white"
              placeholder={'Preheat oven to 400°F\nMix dry ingredients\n...'}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save recipe'}
          </button>
        </form>
      </div>
    </div>
  )
}