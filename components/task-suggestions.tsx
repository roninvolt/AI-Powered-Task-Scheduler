'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/lib/supabase'

interface TaskWithSuggestion extends Task {
  score: number
  matchReason: string
}

export function TaskSuggestions() {
  const [suggestions, setSuggestions] = useState<TaskWithSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskWithSuggestion | null>(null)

  useEffect(() => {
    loadSuggestions()
  }, [])

  async function loadSuggestions() {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks/suggestions')
      if (!response.ok) throw new Error('Failed to load suggestions')
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error('Error loading suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStartTask(task: TaskWithSuggestion) {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      })

      if (!response.ok) throw new Error('Failed to start task')

      setSuggestions(
        suggestions.map((t) =>
          t.id === task.id ? { ...t, status: 'in_progress' as const } : t
        )
      )

      setSelectedTask(null)
    } catch (error) {
      console.error('Error starting task:', error)
    }
  }

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'low':
        return 'bg-green-600'
      case 'high':
        return 'bg-red-600'
      default:
        return 'bg-yellow-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-slate-600'
      case 'high':
        return 'bg-red-600'
      default:
        return 'bg-blue-600'
    }
  }

  return (
    <Card className="border-slate-700 bg-slate-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Recommended Tasks For Today
      </h3>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading recommendations...</p>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No tasks to suggest for today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((task, index) => (
            <div
              key={task.id}
              className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-colors cursor-pointer"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h4 className="font-medium text-white">{task.title}</h4>
                  </div>

                  <p className="text-slate-400 text-sm mb-3">
                    {task.matchReason}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge className={getEnergyColor(task.energy_required)}>
                      {task.energy_required} energy
                    </Badge>
                    {task.estimated_duration && (
                      <Badge className="bg-slate-600">
                        {task.estimated_duration} min
                      </Badge>
                    )}
                  </div>
                </div>

                {task.status !== 'in_progress' && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartTask(task)
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm"
                  >
                    Start
                  </Button>
                )}
                {task.status === 'in_progress' && (
                  <Badge className="bg-yellow-600">In Progress</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <div className="mt-4 border-t border-slate-700 pt-4">
          <h4 className="font-semibold text-white mb-3">Task Details</h4>
          <div className="bg-slate-700/30 rounded p-4 text-sm">
            <p className="text-white mb-2">{selectedTask.title}</p>
            <p className="text-slate-400 text-xs mb-3">
              {selectedTask.description}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-slate-600">
                Match Score: {selectedTask.score}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
