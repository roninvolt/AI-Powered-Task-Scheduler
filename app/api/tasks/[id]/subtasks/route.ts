import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify task belongs to user
    const { data: task } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', params.id)
      .order('order_index', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching subtasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subtasks' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify task belongs to user
    const { data: task } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('subtasks')
      .insert([
        {
          ...body,
          task_id: params.id,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('Error creating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to create subtask' },
      { status: 500 }
    )
  }
}
