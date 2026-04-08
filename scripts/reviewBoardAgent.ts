#!/usr/bin/env tsx
/**
 * Agent 5: Review Board
 * Flags margin/timeline/scope risks
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
  console.log('Review Board Agent starting...')
  const leads = await prisma.lead.findMany({ where: { status: 'REVIEW' }, include: { offerDraft: true, demandAnalysis: true }, take: 10 })
  for (const lead of leads) {
    const o = lead.offerDraft!
    const a = lead.demandAnalysis!
    const flags: string[] = []
    if ((o.proposedPriceMid || 0) < 20000) flags.push('Low price for segment')
    if (a.expectedSalesCycle < 4) flags.push('Aggressive timeline')
    if (JSON.parse(o.offerTerms).length > 6) flags.push('Scope creep risk')
    const riskScore = Math.min(100, flags.length * 33)
    await prisma.riskAssessment.create({
      data: { leadId: lead.id, flags: JSON.stringify(flags), riskScore, marginRisk: flags.some(f => f.includes('price')), timelineRisk: flags.some(f => f.includes('timeline')), scopeRisk: flags.some(f => f.includes('Scope')) }
    })
    const next = riskScore < 50 ? 'PRESENTATION' : 'REVIEW'
    await prisma.lead.update({ where: { id: lead.id }, data: { status: next } })
    await prisma.activityLog.create({ data: { leadId: lead.id, agent: 'ReviewBoardAgent', action: 'RISK_ASSESSED', description: `Risk ${riskScore}` } })
    console.log(`${lead.companyName}: Risk ${riskScore}`)
  }
  console.log('Done')
}
if (require.main === module) run().catch(console.error).finally(() => prisma.$disconnect())
export { run }
