import { supabase } from './supabase'

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) throw error

  // Create user profile
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          energy_level: 5,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          preferred_work_hours: JSON.stringify({ start: '09:00', end: '18:00' }),
        },
      ])

    if (profileError) throw profileError
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error

  return data
}

export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string
    avatar_url?: string
    energy_level?: number
    timezone?: string
    preferred_work_hours?: { start: string; end: string }
  }
) {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      preferred_work_hours: updates.preferred_work_hours
        ? JSON.stringify(updates.preferred_work_hours)
        : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error

  return data
}
