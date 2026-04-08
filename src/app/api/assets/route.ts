import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const tags = searchParams.get('tags')
    const leadId = searchParams.get('leadId')

    const where: any = {}
    if (type) where.type = type
    if (category) where.category = category
    if (leadId) where.leadId = leadId
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
        { tags: { contains: query } },
      ]
    }
    if (tags) {
      where.tags = { contains: tags }
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        lead: { select: { id: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, url, mimeType, size, tags, category, description, leadId } = body

    if (!name || !type || !url) {
      return NextResponse.json({ error: 'name, type, url required' }, { status: 400 })
    }

    const userId = (session.user as any).id

    const asset = await prisma.asset.create({
      data: {
        name,
        type,
        url,
        mimeType: mimeType || null,
        size: size || null,
        tags: tags ? JSON.stringify(tags) : '[]',
        category: category || 'OTHER',
        description: description || null,
        leadId: leadId || null,
        uploadedById: userId,
      }
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error('Failed to create asset:', error)
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}
