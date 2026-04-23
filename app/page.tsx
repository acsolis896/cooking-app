import Link from 'next/link'
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
    <div className="min-h-screen p-6 bg-zinc-50">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold">Cooking App</h1>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-zinc-500 underline"
            >
              Sign out
            </button>
          </form>
        </div>

        <nav className="grid gap-3">
          <Link
            href="/recipes"
            className="block p-5 bg-white rounded-lg border border-zinc-200"
          >
            <div className="font-semibold text-lg">My recipes</div>
            <div className="text-sm text-zinc-500 mt-1">
              Browse and add to your collection
            </div>
          </Link>

          <Link
            href="/plan"
            className="block p-5 bg-white rounded-lg border border-zinc-200"
          >
            <div className="font-semibold text-lg">Meal planner</div>
            <div className="text-sm text-zinc-500 mt-1">
              Plan your week of meals
            </div>
          </Link>

          <div className="block p-5 bg-zinc-100 rounded-lg border border-zinc-200 opacity-60">
            <div className="font-semibold text-lg">Grocery list</div>
            <div className="text-sm text-zinc-500 mt-1">Coming soon</div>
          </div>
        </nav>
      </div>
    </div>
  )
}