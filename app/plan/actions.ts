'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function addMealToPlan(formData: FormData) {
  const recipeId = formData.get('recipe_id') as string
  const planDate = formData.get('plan_date') as string
  const week = formData.get('week') as string

  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Not logged in')

  const { error } = await supabase.from('meal_plans').insert({
    user_id: userData.user.id,
    recipe_id: recipeId,
    plan_date: planDate,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/plan')
  redirect(`/plan?week=${week}`)
}

export async function removeMealFromPlan(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('meal_plans').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/plan')
}