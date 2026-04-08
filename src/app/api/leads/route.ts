import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canAccess } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const stage = searchParams.get('stage')
    const assignedTo = searchParams.get('assignedTo')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (status) where.status = status
    if (stage) where.stage = stage
    if (assignedTo) where.assignedToId = assignedTo

    // Project managers can only see leads in PM handover or later
    const userRole = (session.user as any).role
    if (userRole === 'PROJECT_MANAGER') {
      where.stage = { in: ['STEP_8_1', 'STEP_9', 'COMPLETED'] }
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        offerDraft: { select: { proposedPriceMid: true } },
        triageReview: { select: { demandScore: true, thesis: true } },
        approvals: { where: { status: 'PENDING' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ leads })
  } catch (error) {
    console.error('Failed to fetch leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, companyName, contactName, source, website, phone, assignedToId } = body

    if (!email || !companyName) {
      return NextResponse.json({ error: 'Email and companyName required' }, { status: 400 })
    }

    const lead = await prisma.lead.create({
      data: {
        email,
        companyName,
        contactName: contactName || null,
        source: source || 'web',
        website: website || null,
        phone: phone || null,
        assignedToId: assignedToId || null,
        status: 'QUALIFICATION',
        stage: 'STEP_1',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        agent: 'HUMAN',
        action: 'LEAD_CREATED',
        description: `New lead from ${source}`,
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Failed to create lead:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
