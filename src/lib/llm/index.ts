/**
 * LLM Integration Service - Modular backend for any LLM API
 * Supports: OpenAI, Anthropic, Google Gemini, OpenRouter (multi-provider)
 * 
 * Usage:
 *   import { llm } from '@/lib/llm'
 *   const response = await llm.chat([{ role: 'user', content: 'Hello' }])
 */

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMOptions {
  provider?: LLMProvider
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string // Critical Agent persona injection
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: LLMProvider
}

// Critical Agent Persona - forces LLM to be highly critical
export const CRITICAL_AGENT_PROMPT = `You are the CRITICAL AGENT. Your purpose is to poke holes in lead viability, question economic potential, and rigorously challenge strategies.

You are NOT a "yes-man." You are a ruthless analyst.

Your core directives:
1. CHALLENGE EVERYTHING - Question budget claims, timeline assumptions, and decision-maker access
2. DEMAND EVIDENCE - Don't accept "we're interested" as a signal. Require concrete: budget allocated, timeline committed, decision-maker identified
3. CALCULATE REALITY - What's the actual probability of closing? What could kill this deal?
4. FLAG RED FLAGS - Is this lead wasting our time? Are they just kicking tires?
5. STRATEGIC VALUE - Even if they sign, is this customer worth our time?

When analyzing leads, you MUST output:
- VALIDITY SCORE (0-100): Is this lead real?
- KILL REASONS: Why should we drop this?
- SURVIVAL QUESTIONS: What would need to be true for this to be a YES?
- ECONOMIC SIGNAL: What's the realistic ACV? Deal probability?

Never be encouraging. Be ruthlessly realistic.`


// Provider implementations
async function callOpenAI(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')
  
  const model = options.model || 'gpt-4o'
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }
  
  const data = await response.json()
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage,
    model: data.model,
    provider: 'openai'
  }
}

async function callAnthropic(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
  
  const model = options.model || 'claude-sonnet-4-20250514'
  
  // Anthropic uses different message format
  const systemPrompt = messages.find(m => m.role === 'system')?.content || ''
  const conversation = messages.filter(m => m.role !== 'system')
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
      system: systemPrompt,
      messages: conversation.map(m => ({ role: m.role, content: m.content }))
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${error}`)
  }
  
  const data = await response.json()
  return {
    content: data.content[0]?.text || '',
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens
    },
    model: data.model,
    provider: 'anthropic'
  }
}

async function callGemini(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')
  
  const model = options.model || 'gemini-2.0-flash'
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      systemInstruction: messages.find(m => m.role === 'system') ? {
        parts: [{ text: messages.find(m => m.role === 'system')!.content }]
      } : undefined,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      }
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${error}`)
  }
  
  const data = await response.json()
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    model,
    provider: 'gemini'
  }
}

async function callOpenRouter(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')
  
  const model = options.model || 'openrouter/auto' // Auto-selects best model
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Rob ROI Sales Dashboard'
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${error}`)
  }
  
  const data = await response.json()
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage,
    model: data.model,
    provider: 'openrouter'
  }
}

// Main LLM service
export const llm = {
  /**
   * Send a chat completion request
   */
  async chat(
    messages: LLMMessage[],
    options: LLMOptions = {}
  ): Promise<LLMResponse> {
    const provider = options.provider || (process.env.LLM_PROVIDER as LLMProvider) || 'openrouter'
    
    // Inject Critical Agent persona if requested
    if (options.systemPrompt) {
      messages = [
        { role: 'system', content: options.systemPrompt },
        ...messages
      ]
    }
    
    switch (provider) {
      case 'openai':
        return callOpenAI(messages, options)
      case 'anthropic':
        return callAnthropic(messages, options)
      case 'gemini':
        return callGemini(messages, options)
      case 'openrouter':
      default:
        return callOpenRouter(messages, options)
    }
  },
  
  /**
   * Critical Agent: Analyze a lead with ruthless scrutiny
   */
  async analyzeLead(leadData: {
    companyName: string
    contactName?: string
    email: string
    website?: string
    source: string
    qualificationScore?: number
    demandScore?: number
    budgetEstimate?: string
    tools?: string[]
    painPoints?: string[]
    notes?: string
  }): Promise<{
    validityScore: number
    killReasons: string[]
    survivalQuestions: string[]
    economicSignal: string
    criticalAssessment: string
  }> {
    const prompt = `ANALYZE THIS LEAD WITH EXTREME SCRUTINY:

Company: ${leadData.companyName}
Contact: ${leadData.contactName || 'Unknown'} (${leadData.email})
Source: ${leadData.source}
${leadData.website ? `Website: ${leadData.website}` : ''}

${leadData.qualificationScore !== undefined ? `Qualification Score: ${leadData.qualificationScore}/100` : ''}
${leadData.demandScore !== undefined ? `Demand Score: ${leadData.demandScore}/100` : ''}
${leadData.budgetEstimate ? `Budget Estimate: ${leadData.budgetEstimate}` : ''}
${leadData.tools?.length ? `Known Tools: ${leadData.tools.join(', ')}` : ''}
${leadData.painPoints?.length ? `Pain Points: ${leadData.painPoints.join(', ')}` : ''}
${leadData.notes ? `Notes: ${leadData.notes}` : ''}

Provide your ruthless analysis in this exact format:
VALIDITY_SCORE: [0-100]
KILL_REASONS:
1. [reason]
2. [reason]
...
SURVIVAL_QUESTIONS:
1. [question]
2. [question]
...
ECONOMIC_SIGNAL: [realistic ACV and deal probability]
CRITICAL_ASSESSMENT: [2-3 sentences on why this lead should or shouldn't be pursued]`

    const response = await this.chat([
      { role: 'user', content: prompt }
    ], {
      systemPrompt: CRITICAL_AGENT_PROMPT,
      temperature: 0.3, // Lower temp for more consistent analysis
      maxTokens: 1000
    })
    
    // Parse response
    const text = response.content
    const validityMatch = text.match(/VALIDITY_SCORE:\s*(\d+)/)
    const killMatch = text.match(/KILL_REASONS:([\s\S]*?)(?=SURVIVAL_QUESTIONS|$)/)
    const survivalMatch = text.match(/SURVIVAL_QUESTIONS:([\s\S]*?)(?=ECONOMIC_SIGNAL|$)/)
    const economicMatch = text.match(/ECONOMIC_SIGNAL:\s*([\s\S]*?)(?=CRITICAL_ASSESSMENT|$)/)
    const assessmentMatch = text.match(/CRITICAL_ASSESSMENT:\s*([\s\S]*?)$/)
    
    return {
      validityScore: validityMatch ? parseInt(validityMatch[1]) : 50,
      killReasons: killMatch ? killMatch[1].trim().split('\n').filter(l => l.match(/^\d+\./)).map(l => l.replace(/^\d+\.\s*/, '').trim()) : [],
      survivalQuestions: survivalMatch ? survivalMatch[1].trim().split('\n').filter(l => l.match(/^\d+\./)).map(l => l.replace(/^\d+\.\s*/, '').trim()) : [],
      economicSignal: economicMatch ? economicMatch[1].trim() : 'Unable to assess',
      criticalAssessment: assessmentMatch ? assessmentMatch[1].trim() : ''
    }
  },
  
  /**
   * Generate demand analysis with critical lens
   */
  async generateDemandAnalysis(leadData: {
    companyName: string
    website?: string
    employeeHints?: number
    industrySignals?: string
  }): Promise<{
    estimatedBudget: string
    decisionMakerLevel: string
    currentTools: string[]
    painPoints: string[]
    expectedSalesCycle: number
    missingDataPoints: string[]
    demandScore: number
    criticalGaps: string[]
  }> {
    const prompt = `Generate demand analysis for: ${leadData.companyName}
${leadData.website ? `Website signals: ${leadData.website}` : ''}
${leadData.employeeHints ? `Employee hints: ~${leadData.employeeHints}` : ''}
${leadData.industrySignals ? `Industry: ${leadData.industrySignals}` : ''}

CRITICALLY assess this lead. Don't be generous with budget estimates. Don't assume they're serious.

Output format:
BUDGET_TIER: [sub_50k | 50k_200k | 200k_1m | enterprise]
DECISION_MAKER: [executive | manager | individual_contributor]
CURRENT_TOOLS: [comma-separated]
PAIN_POINTS: [comma-separated]
SALES_CYCLE_WEEKS: [number]
MISSING_DATA: [comma-separated questions needed]
DEMAND_SCORE: [0-100]
CRITICAL_GAPS: [what we DON'T know that could kill this deal]`

    const response = await this.chat([
      { role: 'user', content: prompt }
    ], {
      systemPrompt: CRITICAL_AGENT_PROMPT,
      temperature: 0.3,
      maxTokens: 800
    })
    
    const text = response.content
    const budgetMatch = text.match(/BUDGET_TIER:\s*(\S+)/)
    const dmMatch = text.match(/DECISION_MAKER:\s*(\S+)/)
    const toolsMatch = text.match(/CURRENT_TOOLS:\s*([\s\S]*?)(?=PAIN_POINTS|$)/)
    const painMatch = text.match(/PAIN_POINTS:\s*([\s\S]*?)(?=SALES_CYCLE|$)/)
    const cycleMatch = text.match(/SALES_CYCLE_WEEKS:\s*(\d+)/)
    const missingMatch = text.match(/MISSING_DATA:\s*([\s\S]*?)(?=DEMAND_SCORE|$)/)
    const demandMatch = text.match(/DEMAND_SCORE:\s*(\d+)/)
    const gapsMatch = text.match(/CRITICAL_GAPS:\s*([\s\S]*?)$/)
    
    return {
      estimatedBudget: budgetMatch ? budgetMatch[1] : 'sub_50k',
      decisionMakerLevel: dmMatch ? dmMatch[1] : 'manager',
      currentTools: toolsMatch ? toolsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [],
      painPoints: painMatch ? painMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [],
      expectedSalesCycle: cycleMatch ? parseInt(cycleMatch[1]) : 12,
      missingDataPoints: missingMatch ? missingMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [],
      demandScore: demandMatch ? parseInt(demandMatch[1]) : 50,
      criticalGaps: gapsMatch ? gapsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : []
    }
  },
  
  /**
   * Draft offer with pricing critique
   */
  async draftOffer(analysisData: {
    companyName: string
    budget: string
    demandScore: number
    painPoints: string[]
    competitorHints?: string[]
  }): Promise<{
    pricingModel: string
    low: number
    mid: number
    high: number
    valueProposition: string
    differentiators: string[]
    terms: string[]
    pricingCritique: string
  }> {
    const prompt = `Draft offer for ${analysisData.companyName}
Budget tier: ${analysisData.budget}
Demand score: ${analysisData.demandScore}/100
Pain points: ${analysisData.painPoints.join(', ')}
${analysisData.competitorHints?.length ? `Competitors being evaluated: ${analysisData.competitorHints.join(', ')}` : ''}

CRITICALLY evaluate the pricing. Don't give away the farm. What's the MINIMUM we'd accept? What would be an ambitious but winnable price?

Output:
PRICING_MODEL: [tiered | usage_based | seat_license | enterprise]
PRICE_LOW: [annual USD]
PRICE_MID: [annual USD]
PRICE_HIGH: [annual USD]
VALUE_PROPOSITION: [2-3 sentences]
DIFFERENTIATORS: [comma-separated]
TERMS: [comma-separated]
PRICING_CRITIQUE: [Why this pricing is justified OR what might be wrong with it]`

    const response = await this.chat([
      { role: 'user', content: prompt }
    ], {
      systemPrompt: CRITICAL_AGENT_PROMPT,
      temperature: 0.4,
      maxTokens: 1000
    })
    
    const text = response.content
    const modelMatch = text.match(/PRICING_MODEL:\s*(\S+)/)
    const lowMatch = text.match(/PRICE_LOW:\s*\$?([\d,]+)/)
    const midMatch = text.match(/PRICE_MID:\s*\$?([\d,]+)/)
    const highMatch = text.match(/PRICE_HIGH:\s*\$?([\d,]+)/)
    const vpMatch = text.match(/VALUE_PROPOSITION:\s*([\s\S]*?)(?=DIFFERENTIATORS|$)/)
    const diffMatch = text.match(/DIFFERENTIATORS:\s*([\s\S]*?)(?=TERMS|$)/)
    const termsMatch = text.match(/TERMS:\s*([\s\S]*?)(?=PRICING_CRITIQUE|$)/)
    const critiqueMatch = text.match(/PRICING_CRITIQUE:\s*([\s\S]*?)$/)
    
    return {
      pricingModel: modelMatch ? modelMatch[1] : 'tiered',
      low: lowMatch ? parseInt(lowMatch[1].replace(',', '')) : 12000,
      mid: midMatch ? parseInt(midMatch[1].replace(',', '')) : 24000,
      high: highMatch ? parseInt(highMatch[1].replace(',', '')) : 48000,
      valueProposition: vpMatch ? vpMatch[1].trim() : '',
      differentiators: diffMatch ? diffMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [],
      terms: termsMatch ? termsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [],
      pricingCritique: critiqueMatch ? critiqueMatch[1].trim() : ''
    }
  }
}

export default llm
