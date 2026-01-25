import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral'

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { taskTitle, taskDescription } = await request.json()

    if (!taskTitle) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      )
    }

    // Prepare prompt for Ollama
    const prompt = `You are a productivity assistant. Break down the following task into 3-7 specific, actionable subtasks.

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}

For each subtask, estimate the duration in minutes.

Respond in JSON format only, with this structure:
{
  "subtasks": [
    {
      "title": "subtask title",
      "duration": 30,
      "energy_required": "low|medium|high"
    }
  ],
  "total_duration": 120,
  "summary": "brief summary of the breakdown"
}

Important:
- Make subtasks concrete and specific
- Estimate realistic durations
- Set appropriate energy requirements
- Keep the JSON valid and parseable`

    // Call Ollama API
    const ollamaResponse = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        temperature: 0.7,
        top_p: 0.9,
      }),
    })

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.statusText}`)
    }

    const ollamaData = await ollamaResponse.json()
    
    // Parse the response - it comes as text in the 'response' field
    let breakdown
    try {
      // Extract JSON from the response text
      const responseText = ollamaData.response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        breakdown = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Error parsing Ollama response:', ollamaData.response)
      // Return a fallback breakdown if parsing fails
      breakdown = {
        subtasks: [
          {
            title: taskTitle,
            duration: 60,
            energy_required: 'medium',
          },
        ],
        total_duration: 60,
        summary: 'Unable to generate breakdown automatically',
      }
    }

    return NextResponse.json(breakdown)
  } catch (error) {
    console.error('Error in AI breakdown:', error)
    return NextResponse.json(
      { error: 'Failed to generate task breakdown' },
      { status: 500 }
    )
  }
}
