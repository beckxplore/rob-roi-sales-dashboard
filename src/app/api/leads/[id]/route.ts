import { NextResponse } from 'next/server'
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
        qualification: true,
        demandAnalysis: true,
        triageReview: true,
        offerDraft: true,
        riskAssessment: true,
        presentation: true,
        negotiations: { orderBy: { createdAt: 'desc' } },
        contract: true,
        handoverBrief: true,
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(cleanLead(lead))
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
    const body = await request.json()
    const { status, notes, approved } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (typeof approved === 'boolean' && approved && status === 'OFFER_DRAFT') {
      updateData.status = 'REVIEW'
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        qualification: true,
        demandAnalysis: true,
        triageReview: true,
        offerDraft: true,
        riskAssessment: true,
      },
    })

    await prisma.activityLog.create({
      data: {
        leadId: id,
        agent: 'HUMAN',
        action: status ? 'STATUS_CHANGED' : 'NOTES_UPDATED',
        description: `Human action: status=${status}${approved ? ', approved offer' : ''}`,
        metadata: JSON.stringify({ status, approved }),
      },
    })

    return NextResponse.json(cleanLead(lead))
  } catch (error) {
    console.error('Failed to update lead:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

function cleanLead(lead: any): any {
  return {
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    qualification: lead.qualification ? { ...lead.qualification, checkedAt: lead.qualification.checkedAt.toISOString() } : null,
    demandAnalysis: lead.demandAnalysis ? { ...lead.demandAnalysis, analyzedAt: lead.demandAnalysis.analyzedAt.toISOString() } : null,
    triageReview: lead.triageReview ? { ...lead.triageReview, triagedAt: lead.triageReview.triagedAt.toISOString() } : null,
    offerDraft: lead.offerDraft ? { ...lead.offerDraft, draftedAt: lead.offerDraft.draftedAt.toISOString(), reviewedAt: lead.offerDraft.reviewedAt?.toISOString() || null } : null,
    riskAssessment: lead.riskAssessment ? { ...lead.riskAssessment, assessedAt: lead.riskAssessment.assessedAt.toISOString() } : null,
    presentation: lead.presentation ? { ...lead.presentation, sentAt: lead.presentation.sentAt?.toISOString() || null } : null,
    contract: lead.contract ? { ...lead.contract, sentAt: lead.contract.sentAt?.toISOString() || null, signedAt: lead.contract.signedAt?.toISOString() || null } : null,
    handoverBrief: lead.handoverBrief ? { ...lead.handoverBrief, createdAt: lead.handoverBrief.createdAt.toISOString(), deliveredAt: lead.handoverBrief.deliveredAt?.toISOString() || null } : null,
    activityLogs: lead.activityLog?.map((l: any) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })) || [],
  }
}
