import { NextResponse } from 'next/server'
import { cronJobs, runWeeklyReport, sendDailyPipelineUpdate } from '@/lib/cron'

// Verify cron secret for security
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
      case 'stagnation':
        const stagnation = await cronJobs.checkStagnation()
        return NextResponse.json({ success: true, ...stagnation })
      
      case 'pipeline':
        const pipeline = await cronJobs.pipelineReport()
        return NextResponse.json({ success: true, ...pipeline })
      
      case 'daily':
        await cronJobs.dailyJobs()
        await sendDailyPipelineUpdate()
        return NextResponse.json({ success: true, message: 'Daily jobs completed' })
      
      case 'weekly':
        await runWeeklyReport()
        return NextResponse.json({ success: true, message: 'Weekly report sent' })
      
      default:
        // Run all daily jobs
        const results = await cronJobs.dailyJobs()
        return NextResponse.json({ success: true, ...results })
    }
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ error: 'Cron job failed', details: String(error) }, { status: 500 })
  }
}
