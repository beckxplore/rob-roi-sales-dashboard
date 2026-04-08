/**
 * Cron Job Architecture
 * Scheduled tasks for lead monitoring, pipeline progress, and team performance
 * 
 * Run frequency:
 * - Lead stagnation check: Every 4 hours
 * - Pipeline update: Daily at 8 AM
 * - Team performance: Weekly on Monday 9 AM
 * - Agent digest: Daily at 6 PM
 */

import { notifications } from '@/lib/telegram'
import { prisma } from '@/lib/db'

interface StagnationConfig {
  warningDays: number  // Days before warning
  criticalDays: number // Days before critical alert
}

const STAGNATION_CONFIG: StagnationConfig = {
  warningDays: 7,
  criticalDays: 14
}

/**
 * Check for stagnant leads - no activity for X days
 */
export async function checkLeadStagnation(): Promise<{
  warnings: number
  critical: number
  notified: number
}> {
  const now = new Date()
  const warningThreshold = new Date(now.getTime() - STAGNATION_CONFIG.warningDays * 24 * 60 * 60 * 1000)
  const criticalThreshold = new Date(now.getTime() - STAGNATION_CONFIG.criticalDays * 24 * 60 * 60 * 1000)
  
  // Find stagnant leads
  const stagnantLeads = await prisma.lead.findMany({
    where: {
      status: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
      updatedAt: { lt: warningThreshold }
    },
    include: {
      assignedTo: { select: { name: true, email: true } }
    }
  })
  
  const warnings = stagnantLeads.filter(l => l.updatedAt > criticalThreshold)
  const critical = stagnantLeads.filter(l => l.updatedAt <= criticalThreshold)
  
  // Send Telegram alerts for critical leads
  let notified = 0
  for (const lead of critical.slice(0, 5)) { // Max 5 per run
    const days = Math.floor((now.getTime() - lead.updatedAt.getTime()) / (24 * 60 * 60 * 1000))
    
    await notifications.stagnationAlert({
      companyName: lead.companyName,
      stage: lead.stage || lead.status,
      daysSinceActivity: days,
      assignedTo: lead.assignedTo?.name || 'Unassigned',
      leadLink: `${process.env.NEXT_PUBLIC_APP_URL}/leads/${lead.id}`
    })
    notified++
  }
  
  return {
    warnings: warnings.length,
    critical: critical.length,
    notified
  }
}

/**
 * Generate daily pipeline report
 */
export async function generatePipelineReport(): Promise<{
  total: number
  byStage: Record<string, number>
  closedWon: number
  closedWonValue: number
  closingRate: number
}> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Get all leads
  const allLeads = await prisma.lead.findMany()
  
  // Stage breakdown
  const byStage: Record<string, number> = {}
  for (const lead of allLeads) {
    const stage = lead.stage || lead.status
    byStage[stage] = (byStage[stage] || 0) + 1
  }
  
  // Closed this week
  const closedWon = await prisma.lead.findMany({
    where: {
      status: 'CLOSED_WON',
      updatedAt: { gte: startOfWeek }
    },
    select: {
      offerDraft: { select: { proposedPriceMid: true } }
    }
  })
  
  const closedWonValue = closedWon.reduce((sum, l) => sum + (l.offerDraft?.proposedPriceMid || 0), 0)
  
  // Closing rate
  const totalClosed = await prisma.lead.count({
    where: { status: { in: ['CLOSED_WON', 'CLOSED_LOST'] }, updatedAt: { gte: startOfWeek } }
  })
  
  const closingRate = totalClosed > 0 ? (closedWon.length / totalClosed) * 100 : 0
  
  return {
    total: allLeads.length,
    byStage,
    closedWon: closedWon.length,
    closedWonValue,
    closingRate
  }
}

/**
 * Send daily pipeline update to Telegram
 */
export async function sendDailyPipelineUpdate(): Promise<void> {
  const report = await generatePipelineReport()
  
  // Get top deals in negotiation
  const topDeals = await prisma.lead.findMany({
    where: { status: { in: ['NEGOTIATING', 'PRESENTATION'] } },
    include: { offerDraft: { select: { proposedPriceMid: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 3
  })
  
  await notifications.pipelineUpdate({
    totalLeads: report.total,
    newLeads: report.byStage['STEP_1'] || 0,
    inQualification: (report.byStage['STEP_1'] || 0) + (report.byStage['STEP_2'] || 0),
    inNegotiation: report.byStage['NEGOTIATING'] || 0,
    closedWon: report.closedWon,
    closedWonValue: report.closedWonValue,
    closingRate: report.closingRate,
    topDeals: topDeals.map(l => ({
      name: l.companyName,
      value: l.offerDraft?.proposedPriceMid || 0,
      stage: l.stage || l.status
    }))
  })
}

/**
 * Check for leads needing approval
 */
export async function checkPendingApprovals(): Promise<{
  reviewBoard1: number
  offerApproval: number
  reviewBoard2: number
}> {
  const [rb1, offer, rb2] = await Promise.all([
    prisma.approval.count({ where: { stage: 'REVIEW_BOARD_1', status: 'PENDING' } }),
    prisma.approval.count({ where: { stage: 'OFFER_APPROVAL', status: 'PENDING' } }),
    prisma.approval.count({ where: { stage: 'REVIEW_BOARD_2', status: 'PENDING' } }),
  ])
  
  return { reviewBoard1: rb1, offerApproval: offer, reviewBoard2: rb2 }
}

/**
 * Run all daily cron jobs
 */
export async function runDailyJobs(): Promise<{
  stagnation: { warnings: number; critical: number }
  approvals: { reviewBoard1: number; offerApproval: number; reviewBoard2: number }
  success: boolean
}> {
  console.log('[CRON] Starting daily jobs...')
  
  const stagnation = await checkLeadStagnation()
  const approvals = await checkPendingApprovals()
  
  console.log(`[CRON] Stagnation: ${stagnation.warnings} warnings, ${stagnation.critical} critical`)
  console.log(`[CRON] Pending approvals: RB1=${approvals.reviewBoard1}, Offer=${approvals.offerApproval}, RB2=${approvals.reviewBoard2}`)
  
  return {
    stagnation,
    approvals,
    success: true
  }
}

/**
 * Run weekly team performance report
 */
export async function runWeeklyReport(): Promise<void> {
  console.log('[CRON] Generating weekly performance report...')
  
  // Get team members
  const teamMembers = await prisma.user.findMany({
    where: { role: { in: ['SALES_TEAM', 'SALES_LEAD'] } },
    include: {
      assignedLeads: {
        include: {
          offerDraft: { select: { proposedPriceMid: true } },
          activityLogs: {
            where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
          }
        }
      }
    }
  })
  
  const metrics = teamMembers.map(m => ({
    name: m.name || m.email,
    leadsAssigned: m.assignedLeads.length,
    dealsClosed: m.assignedLeads.filter(l => l.status === 'CLOSED_WON').length,
    revenue: m.assignedLeads
      .filter(l => l.status === 'CLOSED_WON')
      .reduce((sum, l) => sum + (l.offerDraft?.proposedPriceMid || 0), 0),
    avgCycle: 0 // TODO: calculate from createdAt to closedAt
  }))
  
  const topPerformer = metrics.sort((a, b) => b.revenue - a.revenue)[0]
  
  await notifications.teamPerformance({
    period: 'This Week',
    metrics,
    topPerformer: topPerformer?.name || 'N/A'
  })
  
  console.log('[CRON] Weekly report sent')
}

// Export individual job runners for API endpoints
export const cronJobs = {
  checkStagnation: checkLeadStagnation,
  pipelineReport: generatePipelineReport,
  dailyUpdate: sendDailyPipelineUpdate,
  pendingApprovals: checkPendingApprovals,
  dailyJobs: runDailyJobs,
  weeklyReport: runWeeklyReport
}

export default cronJobs
