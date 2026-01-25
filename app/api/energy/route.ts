import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '7')

    const { data, error } = await supabase
      .from('energy_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching energy logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch energy logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { energy_level, mood, notes } = await request.json()

    if (!energy_level || energy_level < 1 || energy_level > 10) {
      return NextResponse.json(
        { error: 'Energy level must be between 1 and 10' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('energy_logs')
      .insert([
        {
          user_id: user.id,
          energy_level,
          mood,
          notes,
          logged_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('Error logging energy:', error)
    return NextResponse.json(
      { error: 'Failed to log energy' },
      { status: 500 }
    )
  }
}
