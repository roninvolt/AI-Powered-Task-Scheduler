'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TaskInputFormProps {
  onTaskCreated?: () => void
  onError?: (error: string) => void
}

interface Subtask {
  title: string
  duration: number
  energy_required: 'low' | 'medium' | 'high'
}

interface Breakdown {
  subtasks: Subtask[]
  total_duration: number
  summary: string
}

export function TaskInputForm({ onTaskCreated, onError }: TaskInputFormProps) {
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [projectId, setProjectId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null)
  const [creatingTask, setCreatingTask] = useState(false)

  async function handleGenerateBreakdown(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle,
          taskDescription,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate breakdown')
      }

      const data = await response.json()
      setBreakdown(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate breakdown'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTask() {
    if (!breakdown) return

    setCreatingTask(true)
    setError('')

    try {
      // Create main task
      const taskResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          priority,
          project_id: projectId || null,
          estimated_duration: breakdown.total_duration,
          status: 'todo',
        }),
      })

      if (!taskResponse.ok) {
        throw new Error('Failed to create task')
      }

      const task = await taskResponse.json()

      // Create subtasks
      for (const [index, subtask] of breakdown.subtasks.entries()) {
        await fetch(`/api/tasks/${task.id}/subtasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: subtask.title,
            estimated_duration: subtask.duration,
            energy_required: subtask.energy_required,
            order_index: index,
          }),
        })
      }

      // Reset form
      setTaskTitle('')
      setTaskDescription('')
      setBreakdown(null)
      setPriority('medium')
      setProjectId('')

      onTaskCreated?.()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create task'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setCreatingTask(false)
    }
  }

  return (
    <Card className="border-slate-700 bg-slate-800">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Create New Task</h2>

        {error && (
          <Alert className="mb-4 border-red-500 bg-red-500/10 text-red-400">
            {error}
          </Alert>
        )}

        <form onSubmit={handleGenerateBreakdown} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskTitle" className="text-slate-300">
              Task Title *
            </Label>
            <Input
              id="taskTitle"
              type="text"
              placeholder="e.g., Design new landing page"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskDescription" className="text-slate-300">
              Description (Optional)
            </Label>
            <Textarea
              id="taskDescription"
              placeholder="Add any additional details..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-slate-300">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId" className="text-slate-300">
                Project (Optional)
              </Label>
              <Input
                id="projectId"
                type="text"
                placeholder="Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !taskTitle}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Generating breakdown...' : 'Generate AI Breakdown'}
          </Button>
        </form>

        {breakdown && (
          <div className="mt-6 border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              AI-Generated Breakdown
            </h3>

            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <p className="text-slate-300 text-sm">{breakdown.summary}</p>
              <p className="text-slate-400 text-xs mt-2">
                Total estimated time: {breakdown.total_duration} minutes
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-slate-200">Subtasks:</h4>
              {breakdown.subtasks.map((subtask, index) => (
                <div
                  key={index}
                  className="bg-slate-700/30 rounded p-3 flex items-start gap-3"
                >
                  <div className="flex-1">
                    <p className="text-white text-sm">{subtask.title}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {subtask.duration} min • Energy: {subtask.energy_required}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setBreakdown(null)}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={creatingTask}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {creatingTask ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
