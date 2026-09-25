import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateKeywordSchema = z.object({
  maxCpcBid: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ keywordId: string }> }) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const keywordId = parseInt(resolvedParams.keywordId, 10);

    // Verify ownership through campaign relation
    const existing = await prisma.keyword.findFirst({
      where: { id: keywordId },
      include: { campaign: true }
    });

    if (!existing || existing.campaign.sellerId !== sellerId) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateKeywordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const updated = await prisma.keyword.update({
      where: { id: keywordId },
      data: parsed.data
    });

    return NextResponse.json({ success: true, keyword: updated });
  } catch (error) {
    console.error('Update keyword error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ keywordId: string }> }) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const keywordId = parseInt(resolvedParams.keywordId, 10);

    const existing = await prisma.keyword.findFirst({
      where: { id: keywordId },
      include: { campaign: true }
    });

    if (!existing || existing.campaign.sellerId !== sellerId) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    await prisma.keyword.delete({ where: { id: keywordId } });

    return NextResponse.json({ success: true, message: 'Keyword deleted' });
  } catch (error) {
    console.error('Delete keyword error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
