import { NextRequest, NextResponse } from 'next/server';
import { runAuction } from '@/lib/rtb-engine';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const searchQuery = searchParams.get('q');
    const placement = searchParams.get('placement') || 'search_results';
    
    // In reality, this would be a tracked user session ID from cookies
    const buyerSessionId = searchParams.get('sessionId') || 'anonymous';

    if (!searchQuery) {
      return NextResponse.json({ error: 'Search query is required to serve relevant ads' }, { status: 400 });
    }

    // ⭐ Run the Real-Time Bidding Auction
    const winningAd = await runAuction({ searchQuery, placement, buyerSessionId });

    if (!winningAd) {
      // No eligible ads found, fallback to organic content
      return NextResponse.json({ success: true, ad: null });
    }

    // Note: Impression is NOT logged here. We wait for the client to actually render it
    // and fire a beacon to /api/events/impression to avoid paying for unseen ads.

    return NextResponse.json({ success: true, ad: winningAd });
  } catch (error) {
    console.error('Serve Ad Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
