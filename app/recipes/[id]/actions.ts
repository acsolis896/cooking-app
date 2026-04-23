'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function deleteRecipe(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }
  revalidatePath('/recipes')
  redirect('/recipes')
}