'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { getCurrentUser } from '@/lib/auth'

export default function AnalyticsPage() {
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
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-slate-400 mt-1">
              Track your productivity and insights over time
            </p>
          </div>
          <Link href="/dashboard">
            <Button className="bg-slate-700 hover:bg-slate-600 text-white">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Main Analytics */}
        <AnalyticsDashboard />

        {/* Insights and Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="font-semibold text-white mb-3">Pro Tips</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Log your energy multiple times throughout the day for better recommendations
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Match tasks to your energy level for maximum productivity
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Break down complex projects into smaller subtasks
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Review your analytics weekly to identify patterns
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="font-semibold text-white mb-3">Understanding Your Data</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <span className="text-white font-medium">Completion Rate:</span> Percentage of
                planned tasks you completed
              </li>
              <li>
                <span className="text-white font-medium">Avg Energy:</span> Your average energy
                level across the period
              </li>
              <li>
                <span className="text-white font-medium">Time Worked:</span> Total estimated
                duration of completed tasks
              </li>
              <li>
                <span className="text-white font-medium">Performance Trend:</span> Whether your
                productivity is improving, declining, or stable
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
