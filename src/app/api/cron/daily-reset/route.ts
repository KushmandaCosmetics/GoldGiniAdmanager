import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint should be called by an external cron service (like Vercel Cron or GitHub Actions)
// exactly at midnight every day. It resets the `spentToday` counter for all campaigns.
export async function GET(req: Request) {
  try {
    // 1. Verify cron secret to prevent unauthorized resets
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow localhost bypassing for easy local testing
      const isLocalhost = req.headers.get('host')?.includes('localhost');
      if (!isLocalhost && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[CRON] Starting midnight daily reset...');

    // 2. Reset spentToday to 0.00 for ALL campaigns
    const resetResult = await prisma.campaign.updateMany({
      data: { spentToday: 0.00 }
    });

    console.log(`[CRON] Reset spentToday for ${resetResult.count} campaigns.`);

    // 3. Reactivate campaigns that were paused due to BUDGET_EXHAUSTED
    // Note: We only reactivate them if their wallet actually has funds.
    
    // Find all BUDGET_EXHAUSTED campaigns
    const exhaustedCampaigns = await prisma.campaign.findMany({
      where: { status: 'BUDGET_EXHAUSTED' },
      include: { seller: { include: { wallet: true } } }
    });

    let reactivatedCount = 0;
    
    for (const campaign of exhaustedCampaigns) {
      const walletBalance = campaign.seller?.wallet?.balance;
      
      // If wallet has positive balance, we can reactivate the campaign for the new day
      if (walletBalance && Number(walletBalance) > 0) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'ACTIVE' }
        });
        reactivatedCount++;
      }
    }

    console.log(`[CRON] Reactivated ${reactivatedCount} budget-exhausted campaigns.`);
    
    // 4. Mark campaigns as ENDED if their endDate has passed
    const now = new Date();
    const endedResult = await prisma.campaign.updateMany({
      where: {
        endDate: { lt: now },
        status: { not: 'ENDED' }
      },
      data: { status: 'ENDED' }
    });

    console.log(`[CRON] Ended ${endedResult.count} expired campaigns.`);

    return NextResponse.json({ 
      success: true, 
      message: 'Daily reset completed',
      stats: {
        resets: resetResult.count,
        reactivated: reactivatedCount,
        ended: endedResult.count
      }
    });

  } catch (error) {
    console.error('[CRON] Daily reset failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
