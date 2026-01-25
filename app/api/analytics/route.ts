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
    const days = parseInt(searchParams.get('days') || '7')

    // Get date range
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Get existing analytics
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })

    if (analyticsError) throw analyticsError

    // Get task completion data
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('scheduled_date, status, estimated_duration')
      .eq('user_id', user.id)
      .gte('scheduled_date', startDateStr)
      .lte('scheduled_date', endDateStr)

    if (tasksError) throw tasksError

    // Get energy logs for the period
    const { data: energyLogs, error: energyError } = await supabase
      .from('energy_logs')
      .select('logged_at, energy_level')
      .eq('user_id', user.id)
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString())

    if (energyError) throw energyError

    // Calculate analytics data
    const calculatedAnalytics = calculateAnalytics(
      tasks || [],
      energyLogs || [],
      startDateStr,
      endDateStr
    )

    // Merge with existing analytics
    const mergedAnalytics = { ...analyticsData, ...calculatedAnalytics }

    return NextResponse.json({
      daily: mergedAnalytics,
      summary: calculateSummary(calculatedAnalytics),
      energyTrend: energyLogs || [],
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

function calculateAnalytics(
  tasks: any[],
  energyLogs: any[],
  startDate: string,
  endDate: string
) {
  const analytics: any = {}

  // Iterate through each day in the range
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]

    // Count tasks for this day
    const dayTasks = tasks.filter((t) => t.scheduled_date === dateStr)
    const completedTasks = dayTasks.filter((t) => t.status === 'done').length
    const totalTasks = dayTasks.length

    // Calculate time worked
    const totalTime = dayTasks.reduce(
      (sum, t) => sum + (t.estimated_duration || 0),
      0
    )

    // Get average energy for this day
    const dayEnergyLogs = energyLogs.filter(
      (log) => log.logged_at.split('T')[0] === dateStr
    )
    const avgEnergy =
      dayEnergyLogs.length > 0
        ? dayEnergyLogs.reduce((sum, log) => sum + log.energy_level, 0) /
          dayEnergyLogs.length
        : null

    analytics[dateStr] = {
      date: dateStr,
      tasks_completed: completedTasks,
      tasks_planned: totalTasks,
      total_time_worked: totalTime,
      avg_energy_level: avgEnergy ? Math.round(avgEnergy * 100) / 100 : null,
      completion_rate:
        totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : null,
    }

    current.setDate(current.getDate() + 1)
  }

  return analytics
}

function calculateSummary(analytics: any) {
  const values = Object.values(analytics) as any[]

  let totalTasksCompleted = 0
  let totalTasksPlanned = 0

  if (values.length === 0) {
    return {
      totalTasksCompleted,
      totalTasksPlanned,
      averageCompletionRate: 0,
      averageEnergyLevel: 0,
      totalTimeWorked: 0,
      bestDay: null,
      trend: 'stable',
    }
  }

  totalTasksCompleted = values.reduce((sum, v) => sum + v.tasks_completed, 0)
  totalTasksPlanned = values.reduce((sum, v) => sum + v.tasks_planned, 0)
  const completionRates = values.filter((v) => v.completion_rate !== null)
  const avgCompletion =
    completionRates.length > 0
      ? Math.round(
          completionRates.reduce((sum, v) => sum + v.completion_rate, 0) /
            completionRates.length
        )
      : 0

  const energyLevels = values.filter((v) => v.avg_energy_level !== null)
  const avgEnergy =
    energyLevels.length > 0
      ? Math.round(
          energyLevels.reduce((sum, v) => sum + v.avg_energy_level, 0) *
            100 /
            energyLevels.length
        ) / 100
      : 0

  const totalTime = values.reduce((sum, v) => sum + v.total_time_worked, 0)

  // Find best day
  const bestDay =
    values.reduce((best, current) =>
      (current.completion_rate || 0) > (best.completion_rate || 0)
        ? current
        : best
    ) || null

  // Determine trend
  let trend = 'stable'
  if (values.length >= 3) {
    const recent = values.slice(-3)
    const older = values.slice(0, 3)
    const recentAvg =
      recent.reduce((sum, v) => sum + (v.completion_rate || 0), 0) /
      recent.length
    const olderAvg =
      older.reduce((sum, v) => sum + (v.completion_rate || 0), 0) /
      older.length

    if (recentAvg > olderAvg * 1.1) trend = 'improving'
    else if (recentAvg < olderAvg * 0.9) trend = 'declining'
  }

  return {
    totalTasksCompleted,
    totalTasksPlanned,
    averageCompletionRate: avgCompletion,
    averageEnergyLevel: avgEnergy,
    totalTimeWorked: totalTime,
    bestDay: bestDay ? bestDay.date : null,
    trend,
  }
}
