import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6 bg-zinc-50">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-2">Cooking App</h1>
        <p className="text-zinc-600 mb-6">
          Signed in as <strong>{user.email}</strong>
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="px-6 py-2 bg-zinc-800 text-white rounded-lg font-medium"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}