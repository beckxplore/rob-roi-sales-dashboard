import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        qualification: true,
        demandAnalysis: true,
        triageReview: true,
        offerDraft: true,
        riskAssessment: true,
        presentations: { take: 1, orderBy: { id: 'desc' }, select: { id: true, status: true, deckUrl: true } },
        negotiations: { orderBy: { createdAt: 'desc' }, take: 1 },
        contract: true,
        handoverBrief: true,
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Failed to fetch lead:', error)
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, stage, notes, priority, assignedToId } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (stage) updateData.stage = stage
    if (notes !== undefined) updateData.notes = notes
    if (priority) updateData.priority = priority
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
    })

    await prisma.activityLog.create({
      data: {
        leadId: id,
        agent: 'HUMAN',
        action: 'UPDATED',
        description: `Updated by ${session.user?.email}`,
        userId: (session.user as any).id,
        metadata: JSON.stringify({ status, stage }),
      },
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Failed to update lead:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}
