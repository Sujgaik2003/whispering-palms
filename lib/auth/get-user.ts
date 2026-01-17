import { createClient } from '@/lib/supabase/server'

/**
 * Get the authenticated user from Supabase session
 * Returns null if user is not authenticated
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Get additional user data from custom users table
  const { data: userData } = await supabase
    .from('users')
    .select('id, email, name, country, preferred_language, timezone, email_verified')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email || '',
    name: userData?.name || null,
    country: userData?.country || null,
    preferred_language: userData?.preferred_language || 'en',
    timezone: userData?.timezone || null,
    email_verified: userData?.email_verified || !!user.email_confirmed_at,
  }
}
