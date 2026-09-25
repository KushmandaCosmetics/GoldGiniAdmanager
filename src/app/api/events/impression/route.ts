import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const impressionSchema = z.object({
  campaignId: z.number(),
  adId: z.number(),
  keywordMatched: z.string().optional(),
  placement: z.string().optional(),
  buyerSessionId: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = impressionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const data = parsed.data;

    // Impressions do NOT trigger billing in a CPC model. We only log the event.
    await prisma.impression.create({
      data: {
        campaignId: data.campaignId,
        adId: data.adId,
        keywordMatched: data.keywordMatched,
        placement: data.placement,
        buyerSessionId: data.buyerSessionId
      }
    });

    return NextResponse.json({ success: true, message: 'Impression logged' });
  } catch (error) {
    console.error('Impression tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
