#!/usr/bin/env tsx
/**
 * Agent 1: Lead Qualification
 * Scrapes website, calculates quality score 0-100, recommends PURSUE/JUNK
 */
import { PrismaClient } from '@prisma/client'
import * as cheerio from 'cheerio'

const prisma = new PrismaClient()

async function scrapeWebsite(url: string): Promise<Record<string, any>> {
  try {
    const res = await fetch(url, { headers: {'User-Agent': 'Mozilla/5.0'}, timeout: 5000 })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    const $ = cheerio.load(html)
    const text = $('body').text()
    const empMatch = text.match(/(\d+)\s*(employees?|people|team)/i)
    return {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      employees: empMatch ? parseInt(empMatch[1]) : null,
      wordCount: text.split(/\s+/).length,
      hasCareers: $('a[href*="career"], a[href*="job"]').length > 0,
      hasPricing: $('a[href*="pricing"]').length > 0,
    }
  } catch { return { error: 'scrape_failed' } }
}

function calcScore(s: any): { score: number; conf: string; rec: string; reasons: string[] } {
  let score = 30
  const reasons: string[] = []
  if (s.title) { score += 15; reasons.push('Has title') }
  if (s.hasCareers) { score += 10; reasons.push('Hiring (growth signal)') }
  if (s.hasPricing) { score += 10; reasons.push('Has pricing page') }
  if (s.employees && s.employees > 20) { score += 10; reasons.push(`~${s.employees} employees`) }
  if (s.error || s.wordCount < 200) { score -= 20; reasons.push('Minimal content') }
  score = Math.max(0, Math.min(100, score))
  const conf = score >= 70 ? 'HIGH' : score <= 30 ? 'LOW' : 'MEDIUM'
  const rec = score >= 65 ? 'PURSUE' : score <= 30 ? 'JUNK' : 'REVIEW_MANUAL'
  return { score, conf, rec, reasons }
}

async function run() {
  console.log('Qualification Agent starting...')
  const leads = await prisma.lead.findMany({ where: { status: { in: ['NEW','QUALIFYING'] }, qualification: { none: {} } }, take: 10 })
  console.log(`Found ${leads.length} leads to qualify`)
  for (const lead of leads) {
    console.log(`Qualifying: ${lead.companyName}`)
    await prisma.lead.update({ where: { id: lead.id }, data: { status: 'QUALIFYING', assignedTo: 'QualificationAgent' } })
    const scraped = lead.website ? await scrapeWebsite(lead.website) : {}
    const { score, conf, rec, reasons } = calcScore(scraped)
    await prisma.leadQualification.create({
      data: { leadId: lead.id, qualityScore: score, confidence: conf, recommendation: rec, reasoning: reasons.join('; '), scrapedData: JSON.stringify(scraped) }
    })
    const next = rec === 'JUNK' ? 'CLOSED_LOST' : 'ANALYZING'
    await prisma.lead.update({ where: { id: lead.id }, data: { status: next } })
    await prisma.activityLog.create({ data: { leadId: lead.id, agent: 'QualificationAgent', action: 'QUALIFIED', description: `Score ${score}, ${rec}` } })
    console.log(`  Score: ${score}, ${rec}`)
  }
  console.log('Done')
}
if (require.main === module) run().catch(console.error).finally(() => prisma.$disconnect())
export { run }
