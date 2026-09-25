import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCampaignSchema = z.object({
  name: z.string().min(3).optional(),
  dailyBudget: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
  endDate: z.string().datetime().nullable().optional(),
  addKeyword: z.object({
    keyword: z.string(),
    matchType: z.enum(['EXACT', 'PHRASE', 'BROAD']),
    maxCpcBid: z.number().positive()
  }).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const campaignId = parseInt(resolvedParams.id, 10);

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, sellerId },
      include: {
        keywords: true,
        ads: true,
        _count: {
          select: { clicks: true, impressions: true }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error('Fetch campaign detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const campaignId = parseInt(resolvedParams.id, 10);

    // Verify ownership
    const existing = await prisma.campaign.findFirst({ where: { id: campaignId, sellerId } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;

    // Handle adding a keyword
    if (data.addKeyword) {
      await prisma.keyword.create({
        data: {
          campaignId,
          keyword: data.addKeyword.keyword,
          matchType: data.addKeyword.matchType,
          maxCpcBid: data.addKeyword.maxCpcBid
        }
      });
      return NextResponse.json({ success: true, message: 'Keyword added' });
    }

    // Check if they are trying to activate a campaign while budget is exhausted
    if (data.status === 'ACTIVE' && Number(existing.spentToday) >= Number(existing.dailyBudget)) {
      return NextResponse.json({ error: 'Cannot activate campaign. Daily budget already exhausted.' }, { status: 400 });
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: data.name,
        dailyBudget: data.dailyBudget,
        status: data.status,
        endDate: data.endDate === null ? null : (data.endDate ? new Date(data.endDate) : undefined),
      }
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error) {
    console.error('Update campaign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const campaignId = parseInt(resolvedParams.id, 10);

    const existing = await prisma.campaign.findFirst({ where: { id: campaignId, sellerId } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    await prisma.campaign.delete({ where: { id: campaignId } });

    return NextResponse.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
