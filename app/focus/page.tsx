'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EnergyTracker } from '@/components/energy-tracker'
import { TaskSuggestions } from '@/components/task-suggestions'
import { getCurrentUser } from '@/lib/auth'

export default function FocusPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
            <h1 className="text-3xl font-bold text-white">Smart Focus</h1>
            <p className="text-slate-400 mt-1">
              AI-powered task recommendations based on your energy level
            </p>
          </div>
          <Link href="/dashboard">
            <Button className="bg-slate-700 hover:bg-slate-600 text-white">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Energy Tracker */}
          <div className="lg:col-span-1">
            <EnergyTracker />
          </div>

          {/* Task Suggestions */}
          <div className="lg:col-span-2">
            <TaskSuggestions />
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="font-semibold text-white mb-3">How Smart Focus Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400">
            <div>
              <p className="text-white font-medium mb-1">1. Log Your Energy</p>
              <p>
                Log your current energy level (1-10) multiple times throughout the day.
              </p>
            </div>
            <div>
              <p className="text-white font-medium mb-1">2. Get Recommendations</p>
              <p>
                The system analyzes your tasks and recommends the best ones for your current state.
              </p>
            </div>
            <div>
              <p className="text-white font-medium mb-1">3. Stay Productive</p>
              <p>
                Work on tasks that match your energy, maximizing productivity without burnout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
