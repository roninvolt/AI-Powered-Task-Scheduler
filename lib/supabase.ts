import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database schema
export type User = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  energy_level: number
  preferred_work_hours: { start: string; end: string }
  timezone: string
  created_at: string
  updated_at: string
}

export type Project = {
  id: string
  user_id: string
  title: string
  description?: string
  color: string
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  user_id: string
  project_id?: string
  title: string
  description?: string
  estimated_duration?: number
  priority: 'low' | 'medium' | 'high'
  energy_required: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  scheduled_date?: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  created_at: string
  updated_at: string
}

export type Subtask = {
  id: string
  task_id: string
  title: string
  estimated_duration?: number
  order_index: number
  status: 'todo' | 'in_progress' | 'done'
  created_at: string
  updated_at: string
}

export type EnergyLog = {
  id: string
  user_id: string
  energy_level: number
  mood?: string
  notes?: string
  logged_at: string
  created_at: string
}

export type Analytics = {
  id: string
  user_id: string
  date: string
  tasks_completed: number
  tasks_planned: number
  avg_energy_level: number
  total_time_worked: number
  focus_sessions_completed: number
  created_at: string
}
