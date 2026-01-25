'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EnergyLog {
  id: string
  energy_level: number
  mood?: string
  notes?: string
  logged_at: string
}

export function EnergyTracker() {
  const [energyLevel, setEnergyLevel] = useState(5)
  const [mood, setMood] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [logs, setLogs] = useState<EnergyLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEnergyLogs()
  }, [])

  async function loadEnergyLogs() {
    try {
      setLoading(true)
      const response = await fetch('/api/energy?limit=7')
      if (!response.ok) throw new Error('Failed to load energy logs')
      const data = await response.json()
      setLogs(data)
    } catch (error) {
      console.error('Error loading energy logs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogEnergy(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          energy_level: energyLevel,
          mood: mood || null,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to log energy')
      }

      setSuccess('Energy logged successfully')
      setNotes('')
      setMood('')
      loadEnergyLogs()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to log energy')
    } finally {
      setSaving(false)
    }
  }

  const getEnergyColor = (level: number) => {
    if (level <= 3) return 'text-red-500'
    if (level <= 6) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getEnergyLabel = (level: number) => {
    if (level <= 3) return 'Low'
    if (level <= 6) return 'Medium'
    return 'High'
  }

  return (
    <div className="space-y-4">
      {/* Energy Logger */}
      <Card className="border-slate-700 bg-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Log Your Energy</h3>

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

        <form onSubmit={handleLogEnergy} className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-slate-300">Energy Level</Label>
              <span className={`text-2xl font-bold ${getEnergyColor(energyLevel)}`}>
                {energyLevel}
              </span>
            </div>
            <Slider
              value={[energyLevel]}
              onValueChange={(value) => setEnergyLevel(value[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-slate-400">
              {getEnergyLabel(energyLevel)} energy
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mood" className="text-slate-300">
              Mood (Optional)
            </Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-300">
                <SelectValue placeholder="Select mood..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="energized">Energized</SelectItem>
                <SelectItem value="focused">Focused</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="tired">Tired</SelectItem>
                <SelectItem value="stressed">Stressed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any thoughts about your energy..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              rows={2}
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? 'Logging...' : 'Log Energy'}
          </Button>
        </form>
      </Card>

      {/* Recent Energy Logs */}
      <Card className="border-slate-700 bg-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Logs</h3>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-slate-400 text-sm">No energy logs yet</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-700/50 rounded p-3 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${getEnergyColor(
                        log.energy_level
                      )}`}
                    >
                      {log.energy_level}
                    </span>
                    <span className="text-xs text-slate-400">
                      {getEnergyLabel(log.energy_level)}
                    </span>
                    {log.mood && (
                      <span className="text-xs text-slate-400">•</span>
                    )}
                    {log.mood && (
                      <span className="text-xs text-slate-400 capitalize">
                        {log.mood}
                      </span>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-xs text-slate-400 mt-1">{log.notes}</p>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(log.logged_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
