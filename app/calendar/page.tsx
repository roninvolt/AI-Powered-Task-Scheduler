'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CalendarView } from '@/components/calendar-view'
import { TaskScheduler } from '@/components/task-scheduler'
import { getCurrentUser } from '@/lib/auth'
import { Task } from '@/lib/supabase'

export default function CalendarPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/auth/login')
          return
        }
        setUser(currentUser)
      } catch (err) {
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Calendar</h1>
            <p className="text-slate-400 mt-1">
              Schedule and manage your tasks
            </p>
          </div>
          <Link href="/dashboard">
            <Button className="bg-slate-700 hover:bg-slate-600 text-white">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar and tasks */}
          <div className="lg:col-span-3">
            <CalendarView
              onTaskSelect={(task) => setSelectedTask(task)}
            />
          </div>

          {/* Task scheduler */}
          <div className="lg:col-span-1">
            <TaskScheduler
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onSave={() => {
                setRefreshKey((prev) => prev + 1)
                setSelectedTask(null)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
