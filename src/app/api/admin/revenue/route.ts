import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    // In production, this would be protected by an Admin API Key or Admin Session Token
    const adminKey = req.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_SECRET_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized Admin Access' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = endOfDay(new Date());

    // Fetch all clicks across the entire platform in the time range
    const allClicks = await prisma.click.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { createdAt: true, cpcCharged: true }
    });

    let totalPlatformRevenue = 0;
    const dailyRevenue: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyRevenue[dateStr] = 0;
    }

    allClicks.forEach(clk => {
      const dateStr = format(clk.createdAt, 'yyyy-MM-dd');
      if (dailyRevenue[dateStr] !== undefined) {
        dailyRevenue[dateStr] += Number(clk.cpcCharged);
        totalPlatformRevenue += Number(clk.cpcCharged);
      }
    });

    const revenueChart = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Also get totals across all time
    const { _sum: totalAllTime } = await prisma.click.aggregate({
      _sum: { cpcCharged: true }
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenuePeriod: totalPlatformRevenue.toFixed(2),
        totalRevenueAllTime: (totalAllTime.cpcCharged || 0).toFixed(2),
        totalClicks: allClicks.length
      },
      chartData: revenueChart
    });

  } catch (error) {
    console.error('Admin revenue fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
