// Combines ingredients across multiple meal plans into a single deduplicated list.
// Ingredients with the same lowercased name + unit get their quantities summed.
// This is the one non-trivial piece of logic in the whole app.

export type AggregatedItem = {
  name: string
  quantity: number | null
  unit: string | null
  source_recipe_id: string | null
}

type PlanInput = {
  servings: number | null
  recipe: {
    id: string
    servings: number | null
    ingredients: {
      name: string
      quantity: number | null
      unit: string | null
    }[]
  }
}

export function aggregateIngredients(plans: PlanInput[]): AggregatedItem[] {
  const bucket = new Map<string, AggregatedItem>()

  for (const plan of plans) {
    const recipeServings = plan.recipe.servings ?? 1
    const plannedServings = plan.servings ?? recipeServings
    const ratio = plannedServings / recipeServings

    for (const ing of plan.recipe.ingredients) {
      const normName = ing.name.trim().toLowerCase()
      const normUnit = (ing.unit ?? '').trim().toLowerCase()
      const key = `${normName}::${normUnit}`

      const qty = (ing.quantity ?? 0) * ratio
      const existing = bucket.get(key)

      if (existing) {
        existing.quantity = (existing.quantity ?? 0) + qty
      } else {
        bucket.set(key, {
          name: ing.name.trim(),
          quantity: qty > 0 ? qty : null,
          unit: ing.unit ?? null,
          source_recipe_id: plan.recipe.id,
        })
      }
    }
  }

  return Array.from(bucket.values())
}