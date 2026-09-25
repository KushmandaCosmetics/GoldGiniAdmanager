import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = endOfDay(new Date());

    // 1. Fetch campaigns for the seller
    const campaigns = await prisma.campaign.findMany({
      where: { sellerId },
      select: { id: true }
    });
    const campaignIds = campaigns.map(c => c.id);

    if (campaignIds.length === 0) {
      return NextResponse.json({ success: true, summary: { impressions: 0, clicks: 0, spend: 0, ctr: 0 }, chartData: [] });
    }

    // 2. Fetch Impression and Click aggregates grouped by Date
    // Note: In a massive scale app, this would query a dedicated Analytics Data Warehouse or ClickHouse.
    // For this implementation, we will query MySQL. Prisma's groupBy on dates can be tricky, so we'll fetch within range and aggregate in JS.
    
    const [impressions, clicks] = await Promise.all([
      prisma.impression.findMany({
        where: {
          campaignId: { in: campaignIds },
          createdAt: { gte: startDate, lte: endDate }
        },
        select: { createdAt: true }
      }),
      prisma.click.findMany({
        where: {
          campaignId: { in: campaignIds },
          createdAt: { gte: startDate, lte: endDate }
        },
        select: { createdAt: true, cpcCharged: true }
      })
    ]);

    // 3. Aggregate by Date
    const dailyData: Record<string, { impressions: number, clicks: number, spend: number }> = {};
    
    // Initialize all dates in range with 0
    for (let i = 0; i < days; i++) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyData[dateStr] = { impressions: 0, clicks: 0, spend: 0 };
    }

    let totalImpressions = impressions.length;
    let totalClicks = clicks.length;
    let totalSpend = 0;

    impressions.forEach(imp => {
      const dateStr = format(imp.createdAt, 'yyyy-MM-dd');
      if (dailyData[dateStr]) dailyData[dateStr].impressions++;
    });

    clicks.forEach(clk => {
      const dateStr = format(clk.createdAt, 'yyyy-MM-dd');
      if (dailyData[dateStr]) {
        dailyData[dateStr].clicks++;
        dailyData[dateStr].spend += Number(clk.cpcCharged);
        totalSpend += Number(clk.cpcCharged);
      }
    });

    // Format for Recharts
    const chartData = Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically

    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;

    return NextResponse.json({
      success: true,
      summary: {
        impressions: totalImpressions,
        clicks: totalClicks,
        spend: totalSpend.toFixed(2),
        ctr
      },
      chartData
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
