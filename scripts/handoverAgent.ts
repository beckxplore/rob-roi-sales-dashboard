#!/usr/bin/env tsx
/**
 * Agent 9: Handover Brief
 * Creates execution roadmap + project brief when contract is signed
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
  console.log('Handover Agent starting...')
  const hourAgo = new Date(Date.now() - 60*60*1000)
  const leads = await prisma.lead.findMany({
    where: { contract: { some: { status: 'SIGNED', signedAt: { gte: hourAgo } } }, handoverBrief: { none: {} } },
    include: { contract: { where: { status: 'SIGNED' }, take: 1 }, offerDraft: true, demandAnalysis: true }
  })
  for (const lead of leads) {
    const slug = `roadmap_${lead.companyName.toLowerCase().replace(/\s+/g,'_')}_${Date.now()}`
    const brief = `# Project Brief: ${lead.companyName}\n\n## Overview\nContract signed. Delivery to begin.\n\n## Timeline\n6-week implementation plan.\n\n## Success Criteria\n1. 25% efficiency gains in 30 days\n2. 3 automations live\n3. 80% user adoption`
    await prisma.handoverBrief.create({
      data: { leadId: lead.id, roadmapSlug: slug, projectBrief: brief, onboardingChecklist: JSON.stringify(['Access provisioned', 'Kickoff scheduled', 'Team identified']), status: 'READY_FOR_REVIEW', createdBy: 'HandoverAgent' }
    })
    await prisma.lead.update({ where: { id: lead.id }, data: { status: 'HANDOVER' } })
    await prisma.activityLog.create({ data: { leadId: lead.id, agent: 'HandoverAgent', action: 'HANDOVER_CREATED', description: `Brief ready: ${slug}` } })
    console.log(`${lead.companyName}: Handover brief created`)
  }
  console.log('Done')
}
if (require.main === module) run().catch(console.error).finally(() => prisma.$disconnect())
export { run }
