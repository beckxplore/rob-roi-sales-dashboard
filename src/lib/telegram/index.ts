/**
 * Telegram Bot Integration
 * Handles notifications, alerts, and updates to dedicated channels/users
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID

export type NotificationType = 
  | 'LEAD_ASSIGNED'
  | 'APPROVAL_REQUIRED'
  | 'DEAL_CLOSED_WON'
  | 'DEAL_CLOSED_LOST'
  | 'STAGNATION_ALERT'
  | 'PIPELINE_UPDATE'
  | 'TEAM_PERFORMANCE'
  | 'CRITICAL_AGENT_ALERT'

interface TelegramMessage {
  text: string
  parse_mode?: 'HTML' | 'Markdown'
  disable_web_page_preview?: boolean
}

async function sendMessage(message: TelegramMessage): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set - skipping Telegram notification')
    return false
  }
  
  const chatId = TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHAT_ID
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        ...message,
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Telegram send error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Telegram fetch error:', error)
    return false
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

// Notification templates
export const notifications = {
  /**
   * Alert when a lead needs executive approval
   */
  async approvalRequired(data: {
    leadName: string
    companyName: string
    demandScore: number
    estimatedValue: number
    approvalLink: string
    requestedBy: string
  }) {
    const scoreEmoji = data.demandScore >= 75 ? '🟢' : data.demandScore >= 50 ? '🟡' : '🔴'
    
    return sendMessage({
      text: `📋 <b>Approval Required</b>

<b>${data.companyName}</b>
Demand Score: ${scoreEmoji} ${data.demandScore}/100
Est. Value: ${formatCurrency(data.estimatedValue)}
Requested by: ${data.requestedBy}

<a href="${data.approvalLink}">Review & Approve →</a>`,
      parse_mode: 'HTML'
    })
  },
  
  /**
   * Deal won notification
   */
  async dealWon(data: {
    companyName: string
    finalValue: number
    salesPerson: string
    timeToClose: number // days
    handoverLink: string
  }) {
    return sendMessage({
      text: `🎉 <b>DEAL CLOSED - WON!</b>

<b>${data.companyName}</b>
Value: ${formatCurrency(data.finalValue)}
Salesperson: ${data.salesPerson}
Time to close: ${data.timeToClose} days

<a href="${data.handoverLink}">Begin Handover →</a>`,
      parse_mode: 'HTML'
    })
  },
  
  /**
   * Deal lost notification
   */
  async dealLost(data: {
    companyName: string
    lostAtStage: string
    lostReason?: string
    estimatedLoss: number
  }) {
    return sendMessage({
      text: `❌ <b>DEAL CLOSED - LOST</b>

<b>${data.companyName}</b>
Lost at: ${data.lostAtStage}
${data.lostReason ? `Reason: ${data.lostReason}` : ''}
Est. Value Lost: ${formatCurrency(data.estimatedLoss)}`
    })
  },
  
  /**
   * Lead stagnation alert - no activity for X days
   */
  async stagnationAlert(data: {
    companyName: string
    stage: string
    daysSinceActivity: number
    assignedTo: string
    leadLink: string
  }) {
    const urgency = data.daysSinceActivity > 14 ? '🚨' : data.daysSinceActivity > 7 ? '⚠️' : '📌'
    
    return sendMessage({
      text: `${urgency} <b>Lead Stagnation Alert</b>

<b>${data.companyName}</b>
Stage: ${data.stage}
Days inactive: ${data.daysSinceActivity}
Assigned to: ${data.assignedTo}

<a href="${data.leadLink}">View Lead →</a>`,
      parse_mode: 'HTML'
    })
  },
  
  /**
   * Pipeline daily update
   */
  async pipelineUpdate(data: {
    totalLeads: number
    newLeads: number
    inQualification: number
    inNegotiation: number
    closedWon: number
    closedWonValue: number
    closingRate: number // percentage
    topDeals: Array<{ name: string; value: number; stage: string }>
  }) {
    const topDealsText = data.topDeals.slice(0, 3).map((d, i) => 
      `${i + 1}. ${d.name} - ${formatCurrency(d.value)} (${d.stage})`
    ).join('\n')
    
    return sendMessage({
      text: `📊 <b>Pipeline Update</b>

Total Leads: ${data.totalLeads}
New today: ${data.newLeads}
In Qualification: ${data.inQualification}
In Negotiation: ${data.inNegotiation}

<b>Closed This Week:</b> ${data.closedWon} deals | ${formatCurrency(data.closedWonValue)}
Closing Rate: ${data.closingRate.toFixed(1)}%

${topDealsText ? `\n<b>Top Deals:</b>\n${topDealsText}` : ''}`,
      parse_mode: 'HTML'
    })
  },
  
  /**
   * Team performance weekly digest
   */
  async teamPerformance(data: {
    period: string
    metrics: Array<{
      name: string
      leadsAssigned: number
      dealsClosed: number
      revenue: number
      avgCycle: number
    }>
    topPerformer: string
  }) {
    const metricsText = data.metrics.map(m => 
      `• ${m.name}: ${m.dealsClosed} closed | ${formatCurrency(m.revenue)}`
    ).join('\n')
    
    return sendMessage({
      text: `🏆 <b>Team Performance - ${data.period}</b>

${metricsText}

<b>Top Performer:</b> ${data.topPerformer}

View full report in dashboard →`
    })
  },
  
  /**
   * Critical Agent alert - high-risk lead flagged
   */
  async criticalAgentAlert(data: {
    companyName: string
    riskScore: number
    riskFactors: string[]
    recommendation: string
    leadLink: string
  }) {
    const riskEmoji = data.riskScore >= 80 ? '🔴' : data.riskScore >= 60 ? '🟡' : '🟢'
    const factors = data.riskFactors.slice(0, 3).join('\n• ')
    
    return sendMessage({
      text: `🚨 <b>Critical Agent Alert</b>

<b>${data.companyName}</b>
Risk Score: ${riskEmoji} ${data.riskScore}/100

<b>Risk Factors:</b>
• ${factors}

<b>Recommendation:</b> ${data.recommendation}

<a href="${data.leadLink}">Review →</a>`,
      parse_mode: 'HTML'
    })
  }
}

// Webhook handler for Telegram Bot updates
export async function handleTelegramWebhook(payload: any): Promise<void> {
  const { message } = payload
  
  if (!message) return
  
  const chatId = message.chat?.id
  const text = message.text || ''
  
  // Handle commands
  if (text.startsWith('/start')) {
    await sendMessage({
      chat_id: chatId,
      text: 'Welcome to Rob ROI Sales Bot. You will receive notifications about leads, approvals, and pipeline updates.'
    })
  }
  
  if (text.startsWith('/pipeline')) {
    // Quick pipeline stats
    await sendMessage({
      chat_id: chatId,
      text: 'Run /dashboard for full pipeline view'
    })
  }
  
  if (text.startsWith('/help')) {
    await sendMessage({
      chat_id: chatId,
      text: `Available commands:
/start - Start bot
/pipeline - Pipeline summary
/approvals - Pending approvals
/help - Show this help`
    })
  }
}

export default { notifications, handleTelegramWebhook, sendMessage }
