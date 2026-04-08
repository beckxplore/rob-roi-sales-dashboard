import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, canApprove } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role

    // Get pending approvals user can access
    const approvals = await prisma.approval.findMany({
      where: { status: 'PENDING' },
      include: {
        lead: {
          include: {
            assignedTo: { select: { name: true } },
            offerDraft: { select: { proposedPriceMid: true } },
          }
        },
        decidedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by role permissions
    const accessible = approvals.filter(a => canApprove(userRole, a.stage))

    return NextResponse.json({ approvals: accessible })
  } catch (error) {
    console.error('Failed to fetch approvals:', error)
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leadId, stage, summary, data } = body

    if (!leadId || !stage || !summary) {
      return NextResponse.json({ error: 'leadId, stage, summary required' }, { status: 400 })
    }

    const userId = (session.user as any).id

    const approval = await prisma.approval.create({
      data: {
        leadId,
        stage,
        summary,
        data: typeof data === 'string' ? data : JSON.stringify(data),
        status: 'PENDING',
      }
    })

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: { decision: 'PENDING' }
    })

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    console.error('Failed to create approval:', error)
    return NextResponse.json({ error: 'Failed to create approval' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { approvalId, status, notes } = body

    if (!approvalId || !status) {
      return NextResponse.json({ error: 'approvalId, status required' }, { status: 400 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: { lead: true }
    })

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    // Check permission
    if (!canApprove(userRole, approval.stage)) {
      return NextResponse.json({ error: 'Not authorized to approve this stage' }, { status: 403 })
    }

    // Update approval
    const updated = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status,
        decidedById: userId,
        decidedAt: new Date(),
        notes: notes || null,
      }
    })

    // Update lead based on decision
    const nextStageMap: Record<string, { stage: string; status: string }> = {
      REVIEW_BOARD_1: { stage: 'STEP_4', status: 'STRATEGY' },
      OFFER_APPROVAL: { stage: 'STEP_5', status: 'PRESENTATION' },
      REVIEW_BOARD_2: { stage: 'STEP_6', status: 'NEGOTIATING' },
    }

    if (status === 'APPROVED') {
      const next = nextStageMap[approval.stage]
      await prisma.lead.update({
        where: { id: approval.leadId },
        data: {
          decision: 'APPROVED',
          decisionById: userId,
          decisionAt: new Date(),
          decisionNotes: notes,
          stage: next?.stage,
          status: next?.status,
        }
      })
    } else if (status === 'REJECTED') {
      await prisma.lead.update({
        where: { id: approval.leadId },
        data: {
          decision: 'REJECTED',
          decisionById: userId,
          decisionAt: new Date(),
          decisionNotes: notes,
          status: 'CLOSED_LOST',
        }
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        leadId: approval.leadId,
        agent: 'HUMAN',
        action: `APPROVAL_${status}`,
        description: `${approval.stage} ${status.toLowerCase()} by user`,
        userId,
        metadata: JSON.stringify({ approvalId, notes }),
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update approval:', error)
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 })
  }
}
