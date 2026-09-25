import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCampaignSchema = z.object({
  name: z.string().min(3),
  dailyBudget: z.number().positive(),
  totalBudget: z.number().positive().optional(),
  startDate: z.string(), // Accept any date string, we'll parse it
  endDate: z.string().optional(),
  objective: z.enum(['SPONSORED_PRODUCTS', 'SPONSORED_BRANDS', 'DISPLAY']).optional(),
  biddingStrategy: z.enum(['FIXED', 'DYNAMIC_DOWN', 'DYNAMIC_UP_DOWN']).optional(),
  audience: z.string().optional(),
  
  // Negative keywords
  negativeKeywords: z.array(z.string()).optional(),
  
  // Nested relations for one-shot creation
  keywords: z.array(z.object({
    keyword: z.string(),
    matchType: z.enum(['EXACT', 'PHRASE', 'BROAD']),
    maxCpcBid: z.number().positive()
  })).min(1),
  
  ads: z.array(z.object({
    productId: z.string(),
    headline: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    targetUrl: z.string()
  })).min(1)
});

// GET /api/campaigns -> List all campaigns for the logged-in seller
export async function GET(req: NextRequest) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const campaigns = await prisma.campaign.findMany({
      where: { sellerId },
      include: {
        keywords: true,
        ads: true,
        _count: {
          select: { clicks: true, impressions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error('Fetch campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/campaigns -> Create a new campaign with keywords and ads
export async function POST(req: NextRequest) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;

    // Ensure seller exists in local DB first to prevent Foreign Key constraints failing
    const { ensureSellerExists } = await import('@/lib/sync-seller');
    await ensureSellerExists(sellerId);

    // Check if seller has a wallet setup
    let wallet = await prisma.sellerWallet.findUnique({ where: { sellerId } });
    if (!wallet) {
      // Auto-create wallet with 0 balance
      wallet = await prisma.sellerWallet.create({
        data: { sellerId, balance: 0 }
      });
    }

    // Parse dates safely
    let startDate: Date;
    try {
      startDate = new Date(data.startDate);
      if (isNaN(startDate.getTime())) throw new Error('Invalid start date');
    } catch {
      return NextResponse.json({ error: 'Invalid start date format' }, { status: 400 });
    }

    let endDate: Date | null = null;
    if (data.endDate) {
      try {
        endDate = new Date(data.endDate);
        if (isNaN(endDate.getTime())) endDate = null;
      } catch {
        endDate = null;
      }
    }

    // Create the campaign, keywords, and ads in a single transaction
    const newCampaign = await prisma.campaign.create({
      data: {
        sellerId,
        name: data.name,
        dailyBudget: data.dailyBudget,
        totalBudget: data.totalBudget,
        startDate,
        endDate,
        status: wallet.balance.toNumber() > 0 ? 'ACTIVE' : 'PAUSED',
        biddingStrategy: data.biddingStrategy || 'FIXED',
        keywords: {
          create: data.keywords.map(kw => ({
            keyword: kw.keyword,
            matchType: kw.matchType,
            maxCpcBid: kw.maxCpcBid
          }))
        },
        negativeKeywords: data.negativeKeywords && data.negativeKeywords.length > 0 ? {
          create: data.negativeKeywords.map(kw => ({ keyword: kw }))
        } : undefined,
        ads: {
          create: data.ads.map(ad => ({
            productId: ad.productId,
            headline: ad.headline,
            description: ad.description,
            imageUrl: ad.imageUrl,
            targetUrl: ad.targetUrl
          }))
        }
      },
      include: {
        keywords: true,
        ads: true
      }
    });

    return NextResponse.json({ success: true, campaign: newCampaign }, { status: 201 });

  } catch (error) {
    console.error('Create campaign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
