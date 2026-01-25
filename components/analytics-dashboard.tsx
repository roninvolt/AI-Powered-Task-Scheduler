'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AnalyticsData {
  daily: Record<string, any>
  summary: {
    totalTasksCompleted: number
    totalTasksPlanned: number
    averageCompletionRate: number
    averageEnergyLevel: number
    totalTimeWorked: number
    bestDay: string | null
    trend: 'improving' | 'declining' | 'stable'
  }
  energyTrend: Array<{ logged_at: string; energy_level: number }>
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    loadAnalytics()
  }, [days])

  async function loadAnalytics() {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?days=${days}`)
      if (!response.ok) throw new Error('Failed to load analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800 p-6">
        <p className="text-slate-400">Loading analytics...</p>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card className="border-slate-700 bg-slate-800 p-6">
        <p className="text-slate-400">No analytics data available yet</p>
      </Card>
    )
  }

  const summary = analytics.summary
  const trendColor =
    summary.trend === 'improving'
      ? 'text-green-400'
      : summary.trend === 'declining'
        ? 'text-red-400'
        : 'text-yellow-400'

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '↑ Improving'
      case 'declining':
        return '↓ Declining'
      default:
        return '→ Stable'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-slate-800 p-4">
          <div className="text-slate-400 text-sm font-medium">Tasks Completed</div>
          <div className="text-3xl font-bold text-white mt-2">
            {summary.totalTasksCompleted}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            of {summary.totalTasksPlanned} planned
          </div>
        </Card>

        <Card className="border-slate-700 bg-slate-800 p-4">
          <div className="text-slate-400 text-sm font-medium">Completion Rate</div>
          <div className="text-3xl font-bold text-white mt-2">
            {summary.averageCompletionRate}%
          </div>
          <div className="text-slate-500 text-xs mt-1">average</div>
        </Card>

        <Card className="border-slate-700 bg-slate-800 p-4">
          <div className="text-slate-400 text-sm font-medium">Avg Energy</div>
          <div className="text-3xl font-bold text-white mt-2">
            {summary.averageEnergyLevel}
          </div>
          <div className="text-slate-500 text-xs mt-1">out of 10</div>
        </Card>

        <Card className="border-slate-700 bg-slate-800 p-4">
          <div className="text-slate-400 text-sm font-medium">Time Worked</div>
          <div className="text-3xl font-bold text-white mt-2">
            {Math.round(summary.totalTimeWorked / 60)}h
          </div>
          <div className="text-slate-500 text-xs mt-1">
            {summary.totalTimeWorked % 60}m
          </div>
        </Card>
      </div>

      {/* Trend and Best Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-700 bg-slate-800 p-4">
          <div className="text-slate-400 text-sm font-medium">Performance Trend</div>
          <div className={`text-2xl font-bold mt-2 ${trendColor}`}>
            {getTrendLabel(summary.trend)}
          </div>
          <p className="text-slate-500 text-xs mt-2">
            {summary.trend === 'improving'
              ? 'Great work! Your productivity is increasing.'
              : summary.trend === 'declining'
                ? 'Your completion rate is declining. Take a break!'
                : 'Your productivity is consistent.'}
          </p>
        </Card>

        <Card className="border-slate-700 bg-slate-800 p-4">
          <div className="text-slate-400 text-sm font-medium">Best Day</div>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.bestDay ? new Date(summary.bestDay).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            }) : 'No data'}
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Your most productive day in this period
          </p>
        </Card>
      </div>

      {/* Daily Breakdown */}
      <Card className="border-slate-700 bg-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Daily Breakdown</h3>

        <div className="space-y-3">
          {Object.values(analytics.daily)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 7)
            .map((day: any) => (
              <div
                key={day.date}
                className="bg-slate-700/50 rounded p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-medium">
                      {new Date(day.date).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <Badge className="bg-slate-600 text-xs">
                      {day.tasks_completed}/{day.tasks_planned} tasks
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>
                      {Math.round(day.total_time_worked / 60)}h{' '}
                      {day.total_time_worked % 60}m worked
                    </span>
                    {day.avg_energy_level && (
                      <span>
                        Avg energy: <span className="text-white">{day.avg_energy_level}</span>/10
                      </span>
                    )}
                  </div>
                </div>

                {day.completion_rate !== null && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {day.completion_rate}%
                    </div>
                    <div className="text-xs text-slate-400">complete</div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </Card>

      {/* Time Range Selector */}
      <div className="flex gap-2 justify-center">
        {[7, 14, 30].map((d) => (
          <Button
            key={d}
            onClick={() => setDays(d)}
            variant={days === d ? 'default' : 'outline'}
            className={
              days === d
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
            }
          >
            Last {d} days
          </Button>
        ))}
      </div>
    </div>
  )
}
