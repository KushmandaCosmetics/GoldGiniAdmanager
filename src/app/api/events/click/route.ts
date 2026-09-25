import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processCpcCharge } from '@/lib/billing';
import { verifyImpressionToken } from '@/lib/impression-token';
import { z } from 'zod';
import crypto from 'crypto';

const clickSchema = z.object({
  campaignId: z.number(),
  adId: z.number(),
  keywordMatched: z.string().optional(),
  actualCpc: z.number().positive(),
  impressionToken: z.string(),
  buyerSessionId: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = clickSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const data = parsed.data;

    // --- 1. Cryptographic Token Verification ---
    const tokenVerification = verifyImpressionToken(data.impressionToken);
    
    if (!tokenVerification.valid || 
        tokenVerification.campaignId !== data.campaignId || 
        tokenVerification.adId !== data.adId) {
      console.warn(`[FRAUD ALERT] Invalid impression token for Ad ${data.adId}`);
      return NextResponse.json({ error: 'Invalid or forged impression token' }, { status: 403 });
    }

    // Verify CPC hasn't been maliciously modified
    if (tokenVerification.actualCpc !== data.actualCpc) {
      console.warn(`[FRAUD ALERT] CPC mismatch. Expected ${tokenVerification.actualCpc}, got ${data.actualCpc}`);
      return NextResponse.json({ error: 'Data integrity failure' }, { status: 403 });
    }

    // --- 2. Advanced Click Fraud Prevention ---
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');
    const userAgent = req.headers.get('user-agent') || '';

    // A. Bot User-Agent Detection
    const botPatterns = [/bot/i, /crawler/i, /spider/i, /headless/i, /puppeteer/i];
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      console.warn(`[FRAUD ALERT] Bot User-Agent detected: ${userAgent}`);
      return NextResponse.json({ success: true, message: 'Click ignored (bot)' }); // Lie to the bot
    }

    // B. Too fast click (Impossible for a human to click within 500ms of seeing the ad)
    if (tokenVerification.ageMs && tokenVerification.ageMs < 500) {
      console.warn(`[FRAUD ALERT] Click velocity too high (${tokenVerification.ageMs}ms)`);
      return NextResponse.json({ success: true, message: 'Click ignored (velocity)' });
    }

    // C. Replay Attack / Duplicate Click (same token used twice)
    const existingClick = await prisma.click.findFirst({
      where: { impressionToken: data.impressionToken }
    });
    
    if (existingClick) {
      console.warn(`[FRAUD ALERT] Token replay attack detected for Ad ${data.adId}`);
      return NextResponse.json({ success: true, message: 'Duplicate click ignored' });
    }

    // D. IP/Session Velocity (Same person clicking multiple times in 1 hour)
    if (data.buyerSessionId || ipHash !== 'unknown') {
      const recentClicks = await prisma.click.count({
        where: {
          adId: data.adId,
          OR: [
            { buyerSessionId: data.buyerSessionId },
            { ipHash: ipHash }
          ],
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Within the last 1 hour
          }
        }
      });

      if (recentClicks >= 2) {
        console.warn(`[FRAUD ALERT] High click velocity for Ad ${data.adId} from Session ${data.buyerSessionId} or IP Hash ${ipHash.substring(0,8)}`);
        return NextResponse.json({ success: true, message: 'Duplicate click ignored for billing' });
      }
    }

    // --- 3. Process Billing Atomically ---
    const billingResult = await processCpcCharge(data.campaignId, data.actualCpc);
    if (!billingResult.success) {
      return NextResponse.json({ error: 'Billing failed, ignoring click', details: billingResult.error }, { status: 402 });
    }

    // --- 4. Log the Click Event ---
    await prisma.click.create({
      data: {
        campaignId: data.campaignId,
        adId: data.adId,
        keywordMatched: data.keywordMatched,
        cpcCharged: data.actualCpc,
        buyerSessionId: data.buyerSessionId,
        impressionToken: data.impressionToken,
        ipHash: ipHash
      }
    });

    return NextResponse.json({ success: true, message: 'Click tracked and billed successfully' });
  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
