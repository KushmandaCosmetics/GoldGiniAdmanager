import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// Initialize Razorpay
// Note: You'll need to add RAZORPAY_KEY_ID and RAZORPAY_SECRET to your .env file
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_SECRET || 'secret_placeholder',
});

// POST -> Create a Razorpay Order
export async function POST(req: NextRequest) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount } = await req.json(); // Amount in INR

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum topup amount is ₹100' }, { status: 400 });
    }

    // Razorpay requires amount in paise (multiply by 100)
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `rcpt_seller_${sellerId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}

// PUT -> Verify Payment and Update Wallet
export async function PUT(req: NextRequest) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = await req.json();

    // Ensure seller exists in local DB to prevent Foreign Key constraint failures
    const { ensureSellerExists } = await import('@/lib/sync-seller');
    await ensureSellerExists(sellerId);

    // Verify signature
    const secret = process.env.RAZORPAY_SECRET || 'secret_placeholder';
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Process topup transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get or create wallet
      let wallet = await tx.sellerWallet.findUnique({
        where: { sellerId }
      });

      if (!wallet) {
        wallet = await tx.sellerWallet.create({
          data: { sellerId, balance: 0 }
        });
      }

      const balanceBefore = wallet.balance;
      const topupAmount = Number(amount); // This should be in INR (not paise) sent from frontend for verification logging, or fetched from razorpay order

      // 2. Update wallet balance
      const updatedWallet = await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: topupAmount }
        }
      });

      // 3. Log transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          sellerId,
          type: 'TOPUP',
          amount: topupAmount,
          description: `Wallet Top-Up via Razorpay (Payment ID: ${razorpay_payment_id})`,
          referenceId: razorpay_payment_id,
          balanceBefore: balanceBefore,
          balanceAfter: updatedWallet.balance
        }
      });

      return { wallet: updatedWallet, transaction };
    });

    return NextResponse.json({ success: true, wallet: result.wallet });

  } catch (error) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
