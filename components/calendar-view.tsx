'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/lib/supabase'
import { format } from 'date-fns'

interface CalendarViewProps {
  onDateSelect?: (date: Date) => void
  onTaskSelect?: (task: Task) => void
}

export function CalendarView({ onDateSelect, onTaskSelect }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [tasksMap, setTasksMap] = useState<Map<string, Task[]>>(new Map())

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true)
        const response = await fetch('/api/tasks')
        if (!response.ok) throw new Error('Failed to load tasks')
        const data = await response.json()
        setTasks(data)

        // Map tasks by date
        const map = new Map<string, Task[]>()
        data.forEach((task: Task) => {
          if (task.scheduled_date) {
            const dateKey = task.scheduled_date
            if (!map.has(dateKey)) {
              map.set(dateKey, [])
            }
            map.get(dateKey)!.push(task)
          }
        })
        setTasksMap(map)
      } catch (error) {
        console.error('Error loading tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd')
  const selectedTasks = tasksMap.get(selectedDateKey) || []

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      onDateSelect?.(date)
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-1">
        <Card className="border-slate-700 bg-slate-800 p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="[&_.react-datepicker]:bg-slate-800 [&_.react-datepicker__header]:bg-slate-700"
          />
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-400">
              Click a date to see scheduled tasks
            </p>
          </div>
        </Card>
      </div>

      {/* Tasks for selected date */}
      <div className="lg:col-span-2">
        <Card className="border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>

          {loading ? (
            <p className="text-slate-400">Loading tasks...</p>
          ) : selectedTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No tasks scheduled for this date</p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Add Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedTasks
                .sort((a, b) => {
                  if (a.scheduled_start_time && b.scheduled_start_time) {
                    return a.scheduled_start_time.localeCompare(b.scheduled_start_time)
                  }
                  return 0
                })
                .map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskSelect?.(task)}
                    className="bg-slate-700/50 rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{task.title}</h4>
                        <p className="text-slate-400 text-sm mt-1">
                          {task.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
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
                      <div className="text-right">
                        {task.scheduled_start_time && (
                          <p className="text-white font-medium text-sm">
                            {task.scheduled_start_time}
                          </p>
                        )}
                        <p className="text-slate-400 text-xs mt-1">
                          {task.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
