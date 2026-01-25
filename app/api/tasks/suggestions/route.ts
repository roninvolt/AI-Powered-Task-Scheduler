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

    // Get user's current energy level from their profile
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('energy_level')
      .eq('id', user.id)
      .single()

    if (userError) throw userError

    const currentEnergy = userProfile.energy_level

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Get tasks scheduled for today that match the user's energy level
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .eq('status', 'todo')

    const { data: allTasks, error: tasksError } = await query

    if (tasksError) throw tasksError

    // Suggest tasks based on energy matching
    const suggestions = suggestTasks(allTasks || [], currentEnergy)

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error fetching task suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}

function suggestTasks(tasks: any[], currentEnergy: number) {
  const energyLevels = {
    low: [1, 2, 3, 4],
    medium: [4, 5, 6, 7],
    high: [7, 8, 9, 10],
  }

  // Determine which energy level group the user is in
  let currentEnergyGroup: 'low' | 'medium' | 'high' = 'medium'
  if (currentEnergy <= 3) currentEnergyGroup = 'low'
  else if (currentEnergy <= 6) currentEnergyGroup = 'medium'
  else currentEnergyGroup = 'high'

  // Score tasks based on match
  const scoredTasks = tasks.map((task) => {
    let score = 0

    // Perfect match with energy level
    if (task.energy_required === currentEnergyGroup) {
      score += 50
    }

    // Adjacent energy levels (less ideal but acceptable)
    if (
      (currentEnergyGroup === 'low' && task.energy_required === 'medium') ||
      (currentEnergyGroup === 'medium' &&
        (task.energy_required === 'low' || task.energy_required === 'high')) ||
      (currentEnergyGroup === 'high' && task.energy_required === 'medium')
    ) {
      score += 25
    }

    // Priority boost
    if (task.priority === 'high') score += 20
    else if (task.priority === 'medium') score += 10

    // Duration consideration (prefer shorter tasks when energy is low)
    if (
      currentEnergyGroup === 'low' &&
      task.estimated_duration &&
      task.estimated_duration <= 30
    ) {
      score += 15
    }

    // Duration consideration (can handle longer tasks when energy is high)
    if (
      currentEnergyGroup === 'high' &&
      task.estimated_duration &&
      task.estimated_duration >= 60
    ) {
      score += 10
    }

    return {
      ...task,
      score,
      matchReason: getMatchReason(
        task.energy_required,
        currentEnergyGroup,
        score
      ),
    }
  })

  // Sort by score and return top suggestions
  return scoredTasks.sort((a, b) => b.score - a.score).slice(0, 5)
}

function getMatchReason(
  taskEnergy: string,
  userEnergy: string,
  score: number
): string {
  if (taskEnergy === userEnergy) {
    return 'Perfect match for your current energy level'
  } else if (score >= 40) {
    return 'Good match for your current energy level'
  } else {
    return 'Can be done with effort'
  }
}
