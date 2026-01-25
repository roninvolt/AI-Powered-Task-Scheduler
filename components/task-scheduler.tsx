'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Task, Subtask } from '@/lib/supabase'
import { format } from 'date-fns'

interface TaskSchedulerProps {
  task: Task | null
  onClose?: () => void
  onSave?: () => void
}

export function TaskScheduler({ task, onClose, onSave }: TaskSchedulerProps) {
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo')
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (task) {
      setScheduledDate(task.scheduled_date || format(new Date(), 'yyyy-MM-dd'))
      setStartTime(task.scheduled_start_time || '09:00')
      setEndTime(task.scheduled_end_time || '10:00')
      setStatus(task.status as any)
      loadSubtasks()
    }
  }, [task])

  async function loadSubtasks() {
    if (!task) return
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks/${task.id}/subtasks`)
      if (!response.ok) throw new Error('Failed to load subtasks')
      const data = await response.json()
      setSubtasks(data)
    } catch (error) {
      console.error('Error loading subtasks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!task) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_date: scheduledDate,
          scheduled_start_time: startTime,
          scheduled_end_time: endTime,
          status,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      setSuccess('Task scheduled successfully')
      setTimeout(() => {
        setSuccess('')
        onSave?.()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  if (!task) {
    return (
      <Card className="border-slate-700 bg-slate-800 p-6">
        <p className="text-slate-400 text-center">Select a task to schedule</p>
      </Card>
    )
  }

  return (
    <Card className="border-slate-700 bg-slate-800">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">{task.title}</h2>
            <p className="text-slate-400 text-sm mt-1">{task.description}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {error && (
          <Alert className="mb-4 border-red-500 bg-red-500/10 text-red-400">
            {error}
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 bg-green-500/10 text-green-400">
            {success}
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate" className="text-slate-300">
                Date
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-300">
                Status
              </Label>
              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'todo' | 'in_progress' | 'done')
                }
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-slate-300">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-slate-300">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {subtasks.length > 0 && (
            <div className="border-t border-slate-700 pt-4">
              <h3 className="font-semibold text-white mb-3">Subtasks</h3>
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="bg-slate-700/50 rounded p-3 flex items-start gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.status === 'done'}
                      className="mt-1 w-4 h-4 rounded"
                      readOnly
                    />
                    <div className="flex-1">
                      <p className="text-white text-sm">{subtask.title}</p>
                      <p className="text-slate-400 text-xs">
                        {subtask.estimated_duration} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 border-t border-slate-700 pt-6">
            {onClose && (
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? 'Saving...' : 'Schedule Task'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
