import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const brief = await prisma.handoverBrief.findUnique({
      where: { id },
      include: { lead: true },
    })
    
    if (!brief) {
      return NextResponse.json({ error: 'Handover brief not found' }, { status: 404 })
    }
    
    if (brief.deliveryTeamNotified) {
      return NextResponse.json({ warning: 'Already delivered' }, { status: 200 })
    }
    
    // In production: call Linear API or GitHub API here
    
    await prisma.handoverBrief.update({
      where: { id: brief.id },
      data: {
        deliveryTeamNotified: true,
        notifiedAt: new Date(),
        status: 'DELIVERED',
      },
    })
    
    await prisma.activityLog.create({
      data: {
        leadId: brief.leadId,
        agent: 'HUMAN',
        action: 'HANDOVER_DELIVERED',
        description: 'Human pushed handover brief to PM system',
      },
    })
    
    return NextResponse.json({ success: true, message: 'Delivered to delivery team' })
  } catch (error) {
    console.error('Delivery error:', error)
    return NextResponse.json({ error: 'Failed to deliver' }, { status: 500 })
  }
}
