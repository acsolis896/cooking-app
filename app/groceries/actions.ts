'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { aggregateIngredients } from '@/lib/groceries/aggregate'
import {
  addDays,
  formatISODate,
  getMondayOfWeek,
  parseISODate,
} from '@/lib/dates'

export async function generateGroceryList(weekISO: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Not logged in')
  const userId = userData.user.id

  const monday = getMondayOfWeek(parseISODate(weekISO))
  const mondayStr = formatISODate(monday)
  const sundayStr = formatISODate(addDays(monday, 6))

  const { data: plans, error: plansError } = await supabase
    .from('meal_plans')
    .select(`
      servings,
      recipes (
        id,
        servings,
        ingredients (name, quantity, unit)
      )
    `)
    .eq('user_id', userId)
    .gte('plan_date', mondayStr)
    .lte('plan_date', sundayStr)
  if (plansError) throw new Error(plansError.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaped = (plans ?? []).map((p: any) => ({
    servings: p.servings,
    recipe: {
      id: p.recipes?.id,
      servings: p.recipes?.servings,
      ingredients: p.recipes?.ingredients ?? [],
    },
  })).filter((p) => p.recipe.id)

  const aggregated = aggregateIngredients(shaped)

  // Remove existing auto-generated items for this week (keep manual items)
  const { error: deleteError } = await supabase
    .from('grocery_items')
    .delete()
    .eq('user_id', userId)
    .eq('week_start', mondayStr)
    .not('source_recipe_id', 'is', null)
  if (deleteError) throw new Error(deleteError.message)

  if (aggregated.length > 0) {
    const rows = aggregated.map((a) => ({
      user_id: userId,
      name: a.name,
      quantity: a.quantity,
      unit: a.unit,
      source_recipe_id: a.source_recipe_id,
      week_start: mondayStr,
      checked: false,
    }))
    const { error: insertError } = await supabase.from('grocery_items').insert(rows)
    if (insertError) throw new Error(insertError.message)
  }

  revalidatePath('/groceries')
}

export async function toggleGroceryItem(id: string, checked: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('grocery_items')
    .update({ checked })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/groceries')
}