import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { llm, CRITICAL_AGENT_PROMPT } from '@/lib/llm'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leadId, message, useCriticalAgent } = body

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const userId = (session.user as any).id

    // Save user message
    await prisma.chatHistory.create({
      data: {
        leadId: leadId || null,
        userId,
        role: 'user',
        content: message,
      }
    })

    // Get chat history for context
    const history = await prisma.chatHistory.findMany({
      where: { leadId: leadId || undefined },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    const reversedHistory = history.reverse()

    // Build messages for LLM
    const systemPrompt = useCriticalAgent ? CRITICAL_AGENT_PROMPT : 
      `You are a helpful AI sales assistant. You help manage leads, draft offers, and provide insights. Be concise and actionable.`
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...reversedHistory.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      { role: 'user' as const, content: message }
    ]

    // If lead context provided, add it
    let leadContext = ''
    if (leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          qualification: true,
          demandAnalysis: true,
          triageReview: true,
          offerDraft: true,
        }
      })
      
      if (lead) {
        leadContext = `\n\nCURRENT LEAD CONTEXT:
Company: ${lead.companyName}
Stage: ${lead.stage || lead.status}
Demand Score: ${lead.demandAnalysis?.demandScore || 'N/A'}
Budget: ${lead.demandAnalysis?.estimatedBudget || 'N/A'}
Notes: ${lead.notes || 'None'}`
        
        // Inject context into last user message
        messages[messages.length - 1].content += leadContext
      }
    }

    // Call LLM
    let llmResponse
    try {
      llmResponse = await llm.chat(messages, {
        temperature: 0.7,
        maxTokens: 1500,
      })
    } catch (llmError) {
      console.error('LLM call failed:', llmError)
      // Fallback response
      llmResponse = {
        content: "I'm having trouble connecting to the AI service. Please try again or contact support.",
        model: 'fallback',
        provider: 'none'
      }
    }

    // Save assistant response
    await prisma.chatHistory.create({
      data: {
        leadId: leadId || null,
        userId,
        role: 'assistant',
        content: llmResponse.content,
        metadata: JSON.stringify({
          model: llmResponse.model,
          provider: llmResponse.provider,
          usage: llmResponse.usage,
        })
      }
    })

    return NextResponse.json({
      response: llmResponse.content,
      model: llmResponse.model,
      provider: llmResponse.provider,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const userId = (session.user as any).id

    const history = await prisma.chatHistory.findMany({
      where: {
        userId, // Only user's own messages
        leadId: leadId || undefined,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Failed to fetch chat history:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
