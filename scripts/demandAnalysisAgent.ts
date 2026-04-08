#!/usr/bin/env tsx
/**
 * Agent 2: Demand Analysis
 * Estimates budget, identifies pain points, calculates demand score
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const BUDGET_MAP: Record<string, number> = { sub_50k: 25000, '50k_200k': 75000, '200k_1m': 400000, enterprise: 800000 }

function detectBudget(emp: number | null): string {
  if (!emp) return '50k_200k'
  if (emp > 500) return 'enterprise'
  if (emp > 100) return '200k_1m'
  if (emp > 20) return '50k_200k'
  return 'sub_50k'
}

async function run() {
  console.log('Demand Analysis Agent starting...')
  const leads = await prisma.lead.findMany({ where: { status: 'ANALYZING', qualification: { some: {} } }, include: { qualification: true }, take: 10 })
  for (const lead of leads) {
    console.log(`Analyzing: ${lead.companyName}`)
    const scraped = JSON.parse(lead.qualification?.scrapedData || '{}')
    const emp = scraped.employees || null
    const budget = detectBudget(emp)
    const qual = lead.qualification!
    const qualScore = qual.qualityScore
    const budgetScore = budget === 'enterprise' ? 100 : budget === '200k_1m' ? 75 : budget === '50k_200k' ? 50 : 25
    const demandScore = Math.round(qualScore * 0.6 + budgetScore * 0.4)
    const tools = ['Slack', 'Excel', 'Email'].concat(scraped.hasPricing ? ['Zapier'] : [])
    const painPoints = ['manual_data_entry', 'reporting_bottleneck', 'process_inefficiency']
    await prisma.demandAnalysis.create({
      data: {
        leadId: lead.id,
        estimatedBudget: budget,
        decisionMakerLevel: emp && emp > 100 ? 'executive' : 'manager',
        currentTools: JSON.stringify(tools),
        painPoints: JSON.stringify(painPoints),
        expectedSalesCycle: budget === 'enterprise' ? 16 : 10,
        missingDataPoints: JSON.stringify(['What is your monthly automation volume?', 'Who are the key stakeholders?']),
        demandScore,
      }
    })
    await prisma.lead.update({ where: { id: lead.id }, data: { status: 'TRIAGE', assignedTo: 'DemandAnalysisAgent' } })
    await prisma.activityLog.create({ data: { leadId: lead.id, agent: 'DemandAnalysisAgent', action: 'ANALYZED', description: `Demand ${demandScore}` } })
    console.log(`  Demand score: ${demandScore}`)
  }
  console.log('Done')
}
if (require.main === module) run().catch(console.error).finally(() => prisma.$disconnect())
export { run }
