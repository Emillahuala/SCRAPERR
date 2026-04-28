/**
 * useAuth — wraps Supabase Auth session state.
 * In mock mode (no env vars), always returns a mock user so the UI is usable.
 */
import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseReady } from '@/lib/supabase'

const MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'demo@offerhunter.app',
  app_metadata: {},
  user_metadata: { display_name: 'Demo User' },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
  role: 'authenticated',
  updated_at: '2026-01-01T00:00:00Z',
}

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: isSupabaseReady() ? null : MOCK_USER,
    session: null,
    loading: isSupabaseReady(),
  })

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) return

    // Get initial session
    client.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })

    // Subscribe to auth changes
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return state
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase no configurado')
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient()
  if (!client) return
  await client.auth.signOut()
}
