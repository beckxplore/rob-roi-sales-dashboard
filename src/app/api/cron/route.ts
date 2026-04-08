import { NextResponse } from 'next/server'
import { cronJobs, runWeeklyReport, sendDailyPipelineUpdate } from '@/lib/cron'

function verifyCronSecret(request: Request): boolean {
  const secret = request.headers.get('x-cron-secret')
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    console.warn('CRON_SECRET not set - allowing all cron requests')
    return true
  }
  return secret === expectedSecret
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const job = searchParams.get('job')

  try {
    switch (job) {
      case 'stagnation': {
        const result = await cronJobs.checkStagnation()
        return NextResponse.json({ success: true, ...result })
      }
      case 'pipeline': {
        const result = await cronJobs.pipelineReport()
        return NextResponse.json({ success: true, ...result })
      }
      case 'daily': {
        await cronJobs.dailyJobs()
        await sendDailyPipelineUpdate()
        return NextResponse.json({ success: true, message: 'Daily jobs completed' })
      }
      case 'weekly': {
        await runWeeklyReport()
        return NextResponse.json({ success: true, message: 'Weekly report sent' })
      }
      default: {
        const results = await cronJobs.dailyJobs()
        const response: Record<string, any> = { success: true }
        Object.assign(response, results)
        return NextResponse.json(response)
      }
    }
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ success: false, error: 'Cron job failed', details: String(error) }, { status: 500 })
  }
}
