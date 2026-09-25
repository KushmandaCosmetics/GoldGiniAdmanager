import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const conversionSchema = z.object({
  orderId: z.string(),
  orderValue: z.number().positive(),
  productId: z.string(),
  buyerSessionId: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = conversionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const data = parsed.data;

    // 1. Check if we have a recent click from this buyer for an ad featuring this product
    // We use a 7-day attribution window (standard for e-commerce ads)
    const attributionWindowDays = 7;
    const cutoffDate = new Date(Date.now() - (attributionWindowDays * 24 * 60 * 60 * 1000));

    // Find the most recent click
    const recentClick = await prisma.click.findFirst({
      where: {
        buyerSessionId: data.buyerSessionId,
        createdAt: { gte: cutoffDate },
        ad: {
          productId: data.productId
        }
      },
      orderBy: { createdAt: 'desc' },
      include: { ad: true }
    });

    if (!recentClick) {
      // No ad click found within attribution window. Not an ad-attributed conversion.
      return NextResponse.json({ success: true, message: 'No attribution found' });
    }

    // 2. Check if this order was already recorded to prevent duplicates
    const existingConversion = await prisma.conversion.findFirst({
      where: { orderId: data.orderId }
    });

    if (existingConversion) {
      return NextResponse.json({ success: true, message: 'Conversion already recorded' });
    }

    // 3. Record the conversion!
    await prisma.conversion.create({
      data: {
        campaignId: recentClick.campaignId,
        adId: recentClick.adId,
        clickId: recentClick.id,
        orderId: data.orderId,
        orderValue: data.orderValue,
        buyerSessionId: data.buyerSessionId
      }
    });

    return NextResponse.json({ success: true, message: 'Conversion successfully attributed to ad' });

  } catch (error) {
    console.error('Conversion tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
