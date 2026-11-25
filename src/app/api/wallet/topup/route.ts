import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Razorpay credentials have NO fallback values. A placeholder secret let anyone forge a
 * "verified" payment and credit their wallet for free.
 */
function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_SECRET;
  if (!keyId || !secret) return null;
  return { keyId, secret, client: new Razorpay({ key_id: keyId, key_secret: secret }) };
}

const MIN_TOPUP_INR = 100;
const MAX_TOPUP_INR = 500000;

// POST -> Create a Razorpay Order
export async function POST(req: NextRequest) {
  try {
    const sellerId = parseInt(req.headers.get('x-seller-id') || '0', 10);
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rzp = getRazorpayConfig();
    if (!rzp) return NextResponse.json({ error: 'Payments are not configured' }, { status: 503 });

    const { amount } = await req.json(); // Amount in INR
    const amountInr = Number(amount);

    if (!Number.isInteger(amountInr) || amountInr < MIN_TOPUP_INR || amountInr > MAX_TOPUP_INR) {
      return NextResponse.json(
        { error: `Top-up must be a whole amount between ₹${MIN_TOPUP_INR} and ₹${MAX_TOPUP_INR}` },
        { status: 400 },
      );
    }

    const order = await rzp.client.orders.create({
      amount: amountInr * 100,
      currency: 'INR',
      receipt: `rcpt_seller_${sellerId}_${Date.now()}`,
      // Bind the Razorpay order to this seller so it cannot be redeemed by someone else.
      notes: { sellerId: String(sellerId), purpose: 'ads_wallet_topup' },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: rzp.keyId,
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

    const rzp = getRazorpayConfig();
    if (!rzp) return NextResponse.json({ error: 'Payments are not configured' }, { status: 503 });

    // Note: any client-sent "amount" is ignored; the credited amount comes from Razorpay.
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (
      typeof razorpay_order_id !== 'string' ||
      typeof razorpay_payment_id !== 'string' ||
      typeof razorpay_signature !== 'string'
    ) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // 1. Signature check (constant time)
    const expectedSignature = crypto
      .createHmac('sha256', rzp.secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    const a = Buffer.from(expectedSignature);
    const b = Buffer.from(razorpay_signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 2. Ask Razorpay what was actually paid, and for whom.
    const [order, payment] = await Promise.all([
      rzp.client.orders.fetch(razorpay_order_id),
      rzp.client.payments.fetch(razorpay_payment_id),
    ]);
    const orderSellerId = String((order.notes as Record<string, unknown> | undefined)?.sellerId ?? '');
    if (
      orderSellerId !== String(sellerId) ||
      payment.order_id !== razorpay_order_id ||
      payment.currency !== 'INR' ||
      !['captured', 'authorized'].includes(String(payment.status)) ||
      Number(payment.amount) !== Number(order.amount)
    ) {
      return NextResponse.json({ error: 'Payment does not match this top-up' }, { status: 400 });
    }
    const topupAmount = Number(payment.amount) / 100;

    // Ensure seller exists in local DB to prevent Foreign Key constraint failures
    const { ensureSellerExists } = await import('@/lib/sync-seller');
    await ensureSellerExists(sellerId);

    // 3. Credit once per payment id.
    const result = await prisma.$transaction(async (tx) => {
      const alreadyCredited = await tx.walletTransaction.findFirst({
        where: { type: 'TOPUP', referenceId: razorpay_payment_id },
        select: { id: true },
      });
      if (alreadyCredited) return null;

      let wallet = await tx.sellerWallet.findUnique({ where: { sellerId } });
      if (!wallet) {
        wallet = await tx.sellerWallet.create({ data: { sellerId, balance: 0 } });
      }

      const balanceBefore = wallet.balance;
      const updatedWallet = await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: topupAmount } },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          sellerId,
          type: 'TOPUP',
          amount: topupAmount,
          description: `Wallet Top-Up via Razorpay (Payment ID: ${razorpay_payment_id})`,
          referenceId: razorpay_payment_id,
          balanceBefore: balanceBefore,
          balanceAfter: updatedWallet.balance,
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    if (!result) {
      const wallet = await prisma.sellerWallet.findUnique({ where: { sellerId } });
      return NextResponse.json({ success: true, alreadyProcessed: true, wallet });
    }

    return NextResponse.json({ success: true, wallet: result.wallet });
  } catch (error) {
    // Unique (type, reference_id) index: a concurrent request already credited this payment.
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }
    console.error('Razorpay verification error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
