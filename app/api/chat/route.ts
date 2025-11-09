import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { message, model, provider } = await request.json()
  
  // Get the connection for this model
  const { data: connection } = await supabase
    .from('ai_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .eq('model_name', model)
    .single()
  
  if (!connection) {
    return NextResponse.json({ error: 'Model not connected' }, { status: 400 })
  }
  
  // Decrypt API key
  const apiKey = connection.api_key_encrypted 
    ? Buffer.from(connection.api_key_encrypted, 'base64').toString('utf-8')
    : null
  
  try {
    let response
    
    // Route to appropriate AI provider
    switch (provider) {
      case 'openai':
        response = await chatWithOpenAI(message, model, apiKey!)
        break
      
      case 'anthropic':
        response = await chatWithAnthropic(message, model, apiKey!)
        break
      
      case 'google':
        response = await chatWithGoogle(message, model, apiKey!)
        break
      
      default:
        throw new Error('Unsupported provider')
    }
    
    return NextResponse.json({ response })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get response' },
      { status: 500 }
    )
  }
}

async function chatWithOpenAI(message: string, model: string, apiKey: string) {
  const openai = new OpenAI({ apiKey })
  
  const completion = await openai.chat.completions.create({
    model: model,
    messages: [{ role: 'user', content: message }],
    max_tokens: 1000
  })
  
  return completion.choices[0].message.content
}

async function chatWithAnthropic(message: string, model: string, apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1000,
      messages: [{ role: 'user', content: message }]
    })
  })
  
  const data = await response.json()
  return data.content[0].text
}

async function chatWithGoogle(message: string, model: string, apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    }
  )
  
  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}
