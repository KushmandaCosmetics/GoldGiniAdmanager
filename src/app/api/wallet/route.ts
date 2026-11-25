import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

// POST /api/wallet used to credit ANY amount to the caller's wallet without a payment.
// Top-ups must go through /api/wallet/topup, which verifies the money with Razorpay.
export async function POST() {
  return NextResponse.json(
    { error: 'Use /api/wallet/topup to add funds.' },
    { status: 405, headers: { Allow: 'GET' } },
  );
}
