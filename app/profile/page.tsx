'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCurrentUser, getUserProfile, updateUserProfile, signOut } from '@/lib/auth'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [fullName, setFullName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [energyLevel, setEnergyLevel] = useState('5')
  const [workStart, setWorkStart] = useState('09:00')
  const [workEnd, setWorkEnd] = useState('18:00')

  useEffect(() => {
    async function loadProfile() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/auth/login')
          return
        }

        setUser(currentUser)
        const userProfile = await getUserProfile(currentUser.id)
        setProfile(userProfile)

        setFullName(userProfile.full_name || '')
        setTimezone(userProfile.timezone || 'UTC')
        setEnergyLevel(userProfile.energy_level?.toString() || '5')

        const workHours = JSON.parse(userProfile.preferred_work_hours || '{}')
        setWorkStart(workHours.start || '09:00')
        setWorkEnd(workHours.end || '18:00')
      } catch (err: any) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateUserProfile(user.id, {
        full_name: fullName,
        energy_level: parseInt(energyLevel),
        timezone,
        preferred_work_hours: { start: workStart, end: workEnd },
      })

      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (err: any) {
      setError(err.message || 'Failed to sign out')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
          >
            Sign Out
          </Button>
        </div>

        <Card className="border-slate-700 bg-slate-800">
          <div className="p-8">
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
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-700 border-slate-600 text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-slate-300">
                    Timezone
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">GMT</SelectItem>
                      <SelectItem value="Europe/Paris">CET</SelectItem>
                      <SelectItem value="Asia/Tokyo">JST</SelectItem>
                      <SelectItem value="Australia/Sydney">AEDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="energyLevel" className="text-slate-300">
                    Current Energy Level (1-10)
                  </Label>
                  <Select value={energyLevel} onValueChange={setEnergyLevel}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {Array.from({ length: 10 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-white">Preferred Work Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workStart" className="text-slate-300">
                      Start Time
                    </Label>
                    <Input
                      id="workStart"
                      type="time"
                      value={workStart}
                      onChange={(e) => setWorkStart(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workEnd" className="text-slate-300">
                      End Time
                    </Label>
                    <Input
                      id="workEnd"
                      type="time"
                      value={workEnd}
                      onChange={(e) => setWorkEnd(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
