'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TaskInputForm } from '@/components/task-input-form'
import { getCurrentUser } from '@/lib/auth'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Welcome back, {user?.email}
            </p>
          </div>
          <Link href="/profile">
            <Button className="bg-slate-700 hover:bg-slate-600 text-white">
              Settings
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            <TaskInputForm
              onTaskCreated={() => {
                setRefreshKey((prev) => prev + 1)
              }}
              onError={(error) => {
                console.error('Task creation error:', error)
              }}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <Card className="border-slate-700 bg-slate-800 p-4">
                <div className="text-slate-400 text-sm">Tasks Today</div>
                <div className="text-2xl font-bold text-white mt-2">0</div>
              </Card>
              <Card className="border-slate-700 bg-slate-800 p-4">
                <div className="text-slate-400 text-sm">In Progress</div>
                <div className="text-2xl font-bold text-white mt-2">0</div>
              </Card>
              <Card className="border-slate-700 bg-slate-800 p-4">
                <div className="text-slate-400 text-sm">Completed</div>
                <div className="text-2xl font-bold text-white mt-2">0</div>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-slate-700 bg-slate-800 p-6">
              <h3 className="font-semibold text-white mb-4">Getting Started</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex gap-2">
                  <span className="text-blue-400">1.</span>
                  <span>Create your first task using AI breakdown</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400">2.</span>
                  <span>View your tasks in the calendar</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400">3.</span>
                  <span>Log your energy levels throughout the day</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400">4.</span>
                  <span>Check analytics and productivity insights</span>
                </div>
              </div>
            </Card>

            <Card className="border-slate-700 bg-slate-800 p-6">
              <h3 className="font-semibold text-white mb-3">Navigation</h3>
              <div className="space-y-2">
                <Link href="/calendar">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  >
                    Calendar View
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  >
                    Analytics
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="border-blue-600/30 bg-blue-600/10 border-2 p-6">
              <h3 className="font-semibold text-blue-400 mb-3">About Ollama</h3>
              <p className="text-sm text-slate-300 mb-3">
                This app uses Ollama to intelligently break down your tasks into subtasks.
              </p>
              <p className="text-xs text-slate-400">
                Make sure you have Ollama running on{' '}
                <span className="text-slate-300">http://localhost:11434</span>
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
