import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { contractId, leadId, signedAt, signerEmail } = body
    
    if (!leadId || !contractId) {
      return NextResponse.json({ error: 'leadId and contractId required' }, { status: 400 })
    }
    
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: 'SIGNED', signedAt: signedAt ? new Date(signedAt) : new Date() },
    })
    
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'HANDOVER' },
    })
    
    await prisma.activityLog.create({
      data: {
        leadId,
        agent: 'WEBHOOK',
        action: 'CONTRACT_SIGNED',
        description: `Contract signed by ${signerEmail}. Moving to HANDOVER.`,
      },
    })
    
    return NextResponse.json({ success: true, message: 'Contract marked signed.' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
