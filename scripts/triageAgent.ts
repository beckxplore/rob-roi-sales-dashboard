#!/usr/bin/env tsx
/**
 * Agent 3: Triage Board
 * Generates AI thesis, recommends PROCEED or KILL
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
  console.log('Triage Agent starting...')
  const leads = await prisma.lead.findMany({ where: { status: 'TRIAGE' }, include: { demandAnalysis: true, qualification: true }, take: 10 })
  for (const lead of leads) {
    const a = lead.demandAnalysis!
    const score = a.demandScore
    const thesis = score >= 70 
      ? `Strong fit. ${a.estimatedBudget} budget with clear automation needs. Proceed with full offer.`
      : score >= 50
      ? `Moderate fit. Good budget signal but needs qualification on timeline.`
      : `Low fit. Limited budget signal. Recommend kill or nurture.`
    const action = score >= 60 ? 'PROCEED' : 'KILL'
    await prisma.triageReview.create({
      data: { leadId: lead.id, demandScore: score, thesis, recommendedAction: action, confidence: score >= 75 ? 'HIGH' : 'MEDIUM' }
    })
    await prisma.lead.update({ where: { id: lead.id }, data: { status: action === 'PROCEED' ? 'OFFER_DRAFT' : 'CLOSED_LOST' } })
    await prisma.activityLog.create({ data: { leadId: lead.id, agent: 'TriageAgent', action: 'TRIAGED', description: `${action}: ${thesis}` } })
    console.log(`${lead.companyName}: ${action} (${score})`)
  }
  console.log('Done')
}
if (require.main === module) run().catch(console.error).finally(() => prisma.$disconnect())
export { run }
