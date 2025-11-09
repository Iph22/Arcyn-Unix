import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  const { provider, model_name, api_key } = await request.json()
  
  try {
    // Test connection based on provider
    switch (provider) {
      case 'openai':
        return await testOpenAI(api_key)
      
      case 'anthropic':
        return await testAnthropic(api_key)
      
      case 'google':
        return await testGoogle(api_key)
      
      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Connection test failed' },
      { status: 400 }
    )
  }
}

async function testOpenAI(apiKey: string) {
  const openai = new OpenAI({ apiKey })
  
  // Simple test: list models
  await openai.models.list()
  
  return NextResponse.json({ success: true })
}

async function testAnthropic(apiKey: string) {
  // Test Anthropic connection
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    })
  })
  
  if (!response.ok) {
    throw new Error('Invalid API key')
  }
  
  return NextResponse.json({ success: true })
}

async function testGoogle(apiKey: string) {
  // Test Google AI connection
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}` 
  )
  
  if (!response.ok) {
    throw new Error('Invalid API key')
  }
  
  return NextResponse.json({ success: true })
}
