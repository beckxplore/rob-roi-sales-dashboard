import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = status ? { status } : {}
    const leads = await prisma.lead.findMany({
      where,
      include: {
        qualification: true,
        demandAnalysis: true,
        triageReview: true,
        offerDraft: true,
        riskAssessment: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ leads })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, companyName, contactName, source, website } = body
    if (!email || !companyName) return NextResponse.json({ error: 'Required: email, companyName' }, { status: 400 })
    const lead = await prisma.lead.create({
      data: { email, companyName, contactName: contactName || null, source: source || 'web', website: website || null, status: 'NEW' },
    })
    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
