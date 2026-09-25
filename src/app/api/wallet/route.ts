import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const topupSchema = z.object({
  amount: z.number().positive(),
  referenceId: z.string().optional(),
});

// GET /api/wallet -> fetch current balance and transactions
export async function GET(req: NextRequest) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const wallet = await prisma.sellerWallet.findUnique({
      where: { sellerId },
      include: {
        seller: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 20
            }
          }
        }
      }
    });

    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });

    return NextResponse.json({ 
      success: true, 
      balance: wallet.balance,
      transactions: wallet.seller.transactions
    });
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/wallet -> Add funds (top-up)
export async function POST(req: NextRequest) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = topupSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { amount, referenceId } = parsed.data;

    // Use Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.sellerWallet.findUnique({ where: { sellerId } });
      if (!wallet) throw new Error('Wallet not found');

      const balanceBefore = wallet.balance;
      const balanceAfter = Number(balanceBefore) + amount;

      const updatedWallet = await tx.sellerWallet.update({
        where: { sellerId },
        data: { balance: balanceAfter }
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          sellerId,
          type: 'TOPUP',
          amount,
          description: 'Wallet top-up',
          referenceId: referenceId || `TOPUP-${Date.now()}`,
          balanceBefore,
          balanceAfter
        }
      });

      return { updatedWallet, transaction };
    });

    return NextResponse.json({ success: true, wallet: result.updatedWallet });
  } catch (error) {
    console.error('Wallet top-up error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
