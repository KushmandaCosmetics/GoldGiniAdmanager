import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addKeywordSchema = z.object({
  keyword: z.string().min(1),
  matchType: z.enum(['EXACT', 'PHRASE', 'BROAD']),
  maxCpcBid: z.number().positive(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const campaignId = parseInt(resolvedParams.id, 10);

    // Verify ownership
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, sellerId } });
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const keywords = await prisma.keyword.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, keywords });
  } catch (error) {
    console.error('Fetch keywords error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const campaignId = parseInt(resolvedParams.id, 10);

    // Verify ownership
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, sellerId } });
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const body = await req.json();
    const parsed = addKeywordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;

    // Check for duplicate keyword in the same campaign
    const existingKeyword = await prisma.keyword.findFirst({
      where: { campaignId, keyword: data.keyword, matchType: data.matchType }
    });

    if (existingKeyword) {
      return NextResponse.json({ error: 'Keyword already exists in this campaign' }, { status: 409 });
    }

    const keyword = await prisma.keyword.create({
      data: {
        campaignId,
        keyword: data.keyword,
        matchType: data.matchType,
        maxCpcBid: data.maxCpcBid
      }
    });

    return NextResponse.json({ success: true, keyword }, { status: 201 });
  } catch (error) {
    console.error('Add keyword error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
