/**
 * Telegram Bot Integration
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID

interface TelegramPayload {
  text: string
  parse_mode?: 'HTML' | 'Markdown'
  disable_web_page_preview?: boolean
  chat_id?: string
}

async function sendMessage(payload: TelegramPayload): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set')
    return false
  }
  
  const chatId = payload.chat_id || TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHAT_ID
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: payload.text,
        parse_mode: payload.parse_mode,
      })
    })
    return response.ok
  } catch (error) {
    console.error('Telegram error:', error)
    return false
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export const notifications = {
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
      text: `📋 <b>Approval Required</b>\n\n<b>${data.companyName}</b>\nDemand Score: ${scoreEmoji} ${data.demandScore}/100\nEst. Value: ${formatCurrency(data.estimatedValue)}\nRequested by: ${data.requestedBy}\n\n<a href="${data.approvalLink}">Review & Approve →</a>`,
      parse_mode: 'HTML'
    })
  },

  async dealWon(data: { companyName: string; finalValue: number; salesPerson: string; timeToClose: number; handoverLink: string }) {
    return sendMessage({
      text: `🎉 <b>DEAL CLOSED - WON!</b>\n\n<b>${data.companyName}</b>\nValue: ${formatCurrency(data.finalValue)}\nSalesperson: ${data.salesPerson}\nTime to close: ${data.timeToClose} days\n\n<a href="${data.handoverLink}">Begin Handover →</a>`,
      parse_mode: 'HTML'
    })
  },

  async stagnationAlert(data: { companyName: string; stage: string; daysSinceActivity: number; assignedTo: string; leadLink: string }) {
    const urgency = data.daysSinceActivity > 14 ? '🚨' : data.daysSinceActivity > 7 ? '⚠️' : '📌'
    return sendMessage({
      text: `${urgency} <b>Lead Stagnation Alert</b>\n\n<b>${data.companyName}</b>\nStage: ${data.stage}\nDays inactive: ${data.daysSinceActivity}\nAssigned to: ${data.assignedTo}\n\n<a href="${data.leadLink}">View Lead →</a>`,
      parse_mode: 'HTML'
    })
  },

  async pipelineUpdate(data: {
    totalLeads: number
    newLeads: number
    inQualification: number
    inNegotiation: number
    closedWon: number
    closedWonValue: number
    closingRate: number
    topDeals: Array<{ name: string; value: number; stage: string }>
  }) {
    const topDealsText = data.topDeals.slice(0, 3).map((d, i) => `${i + 1}. ${d.name} - ${formatCurrency(d.value)} (${d.stage})`).join('\n')
    return sendMessage({
      text: `📊 <b>Pipeline Update</b>\n\nTotal Leads: ${data.totalLeads}\nNew today: ${data.newLeads}\nIn Qualification: ${data.inQualification}\nIn Negotiation: ${data.inNegotiation}\n\n<b>Closed This Week:</b> ${data.closedWon} deals | ${formatCurrency(data.closedWonValue)}\nClosing Rate: ${data.closingRate.toFixed(1)}%\n\n${topDealsText ? `\n<b>Top Deals:</b>\n${topDealsText}` : ''}`,
      parse_mode: 'HTML'
    })
  },

  async teamPerformance(data: {
    period: string
    metrics: Array<{ name: string; leadsAssigned: number; dealsClosed: number; revenue: number; avgCycle: number }>
    topPerformer: string
  }) {
    const metricsText = data.metrics.map(m => `• ${m.name}: ${m.dealsClosed} closed | ${formatCurrency(m.revenue)}`).join('\n')
    return sendMessage({
      text: `🏆 <b>Team Performance - ${data.period}</b>\n\n${metricsText}\n\n<b>Top Performer:</b> ${data.topPerformer}`,
    })
  },

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
      text: `🚨 <b>Critical Agent Alert</b>\n\n<b>${data.companyName}</b>\nRisk Score: ${riskEmoji} ${data.riskScore}/100\n\n<b>Risk Factors:</b>\n• ${factors}\n\n<b>Recommendation:</b> ${data.recommendation}\n\n<a href="${data.leadLink}">Review →</a>`,
      parse_mode: 'HTML'
    })
  }
}

export async function handleTelegramWebhook(payload: any): Promise<void> {
  const { message } = payload
  if (!message) return
  
  const chatId = message.chat?.id
  const text = message.text || ''
  
  if (text.startsWith('/start')) {
    await sendMessage({ chat_id: String(chatId), text: 'Welcome to Rob ROI Sales Bot.' })
  }
  
  if (text.startsWith('/help')) {
    await sendMessage({ chat_id: String(chatId), text: 'Commands: /start, /pipeline, /help' })
  }
}

export default { notifications, handleTelegramWebhook, sendMessage }
