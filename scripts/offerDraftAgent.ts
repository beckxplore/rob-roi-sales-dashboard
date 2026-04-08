#!/usr/bin/env tsx
/**
 * Agent 4: Offer Draft
 * Generates tiered pricing + value proposition
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const PRICE_MAP: Record<string, [number,number,number]> = {
  enterprise: [120000, 250000, 500000],
  '200k_1m': [80000, 150000, 300000],
  '50k_200k': [30000, 60000, 120000],
  sub_50k: [12000, 24000, 48000],
}

async function run() {
  console.log('Offer Draft Agent starting...')
  const leads = await prisma.lead.findMany({ where: { status: 'OFFER_DRAFT' }, include: { demandAnalysis: true }, take: 10 })
  for (const lead of leads) {
    const a = lead.demandAnalysis!
    const [low, mid, high] = PRICE_MAP[a.estimatedBudget] || [30000, 60000, 120000]
    const vp = `Based on your ${a.painPoints} challenges, Rob ROI can deliver 25-30% efficiency gains within the first quarter. Our AI-native platform integrates with ${a.currentTools} to automate repetitive workflows.`
    await prisma.offerDraft.create({
      data: {
        leadId: lead.id,
        pricingModel: 'tiered',
        proposedPriceLow: low, proposedPriceMid: mid, proposedPriceHigh: high,
        valueProposition: vp,
        offerTerms: JSON.stringify(['30-day money-back', 'Implementation included', '24/7 support', 'Monthly reporting']),
        differentiators: JSON.stringify(['AI-native', 'Self-improving workflows', '200+ integrations']),
        nextSteps: JSON.stringify(['Kickoff call', 'Workflow audit', 'Pilot deployment', 'Full rollout']),
      }
    })
    await prisma.lead.update({ where: { id: lead.id }, data: { status: 'REVIEW' } })
    await prisma.activityLog.create({ data: { leadId: lead.id, agent: 'OfferDraftAgent', action: 'OFFER_DRAFTED', description: `Offer: $${mid.toLocaleString()}` } })
    console.log(`${lead.companyName}: Offer $${mid.toLocaleString()}`)
  }
  console.log('Done')
}
if (require.main === module) run().catch(console.error).finally(() => prisma.$disconnect())
export { run }
