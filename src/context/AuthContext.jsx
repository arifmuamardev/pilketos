import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data } = await supabase
      .from('app_users')
      .select('user_id,display_name,role,polling_station_id')
      .eq('user_id', userId)
      .maybeSingle()
    setProfile(data || null)
  }

  async function refresh() {
    const { data: { session: current } } = await supabase.auth.getSession()
    setSession(current)
    await loadProfile(current?.user?.id)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next)
      await loadProfile(next?.user?.id)
      setLoading(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    loading,
    refresh,
    signOut: () => supabase.auth.signOut(),
  }), [session, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
