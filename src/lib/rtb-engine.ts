import { prisma } from './prisma';
import { generateImpressionToken } from './impression-token';

export interface AdRequest {
  searchQuery: string;
  placement: string;
  buyerSessionId: string;
}

export interface AdResponse {
  adId: number;
  campaignId: number;
  productId: string;
  headline: string;
  imageUrl: string | null;
  targetUrl: string;
  actualCpc: number;
  impressionToken: string;
}

// Simple NLP tokenization for BROAD match overlap
function getTokens(str: string): string[] {
  return str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
}

export async function runAuction(req: AdRequest): Promise<AdResponse | null> {
  const { searchQuery } = req;
  const searchTokens = getTokens(searchQuery);

  // 1. Fetch eligible candidates (Active campaigns with matching keywords and budget remaining)
  // Get all active keywords for active campaigns first, then filter in memory for advanced logic
  const allCandidates = await prisma.keyword.findMany({
    where: {
      isActive: true,
      campaign: {
        status: 'ACTIVE',
      }
    },
    include: {
      campaign: {
        include: { 
          ads: true,
          negativeKeywords: true,
          _count: { select: { clicks: true, impressions: true } }
        }
      }
    }
  });

  if (allCandidates.length === 0) return null;

  // Filter candidates based on advanced matching rules and negative keywords
  const validCandidates = allCandidates.filter(candidate => {
    // Check Negative Keywords first
    const hasNegativeMatch = candidate.campaign.negativeKeywords.some(neg => {
      // Assuming phrase match for negative keywords (safest approach)
      return searchQuery.toLowerCase().includes(neg.keyword.toLowerCase());
    });
    
    if (hasNegativeMatch) return false;

    // Check Match Types
    const kw = candidate.keyword.toLowerCase();
    const sq = searchQuery.toLowerCase();

    if (candidate.matchType === 'EXACT') {
      return kw === sq;
    } else if (candidate.matchType === 'PHRASE') {
      return sq.includes(kw);
    } else if (candidate.matchType === 'BROAD') {
      // Broad match: At least one significant token must overlap
      const kwTokens = getTokens(kw);
      return kwTokens.some(token => searchTokens.includes(token));
    }
    
    return false;
  });

  if (validCandidates.length === 0) return null;

  // 2. Score Candidates (Calculate Ad Rank)
  // Ad Rank = Bid * Quality Score
  
  // Calculate what percentage of the day has passed for Budget Pacing
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const percentOfDayPassed = (now.getTime() - startOfDay.getTime()) / (24 * 60 * 60 * 1000);

  const scoredCandidates = validCandidates.map(candidate => {
    // Quality Score v1 (historical CTR)
    const imps = candidate.campaign._count.impressions;
    const clicks = candidate.campaign._count.clicks;
    
    // Default quality score of 1.0. If we have >100 impressions, calculate real CTR
    // Add 1.0 to smooth it out (CTR is typically < 5%, so 1 + CTR*10)
    let qualityScore = 1.0;
    if (imps > 100) {
      const ctr = clicks / imps;
      qualityScore = 1.0 + (ctr * 10); // e.g. 2% CTR = 1.2 QS
    }

    // Adjust maxCpcBid based on Bidding Strategy
    let bidMultiplier = 1.0;
    if (candidate.campaign.biddingStrategy === 'DYNAMIC_DOWN') {
      // Lower bid if CTR is poor (< 0.5% after 100 imps)
      if (imps > 100 && (clicks / imps) < 0.005) bidMultiplier = 0.5;
    } else if (candidate.campaign.biddingStrategy === 'DYNAMIC_UP_DOWN') {
      // Raise bid if CTR is excellent (> 3%)
      if (imps > 100) {
        const ctr = clicks / imps;
        if (ctr > 0.03) bidMultiplier = 1.5;
        else if (ctr < 0.005) bidMultiplier = 0.5;
      }
    }

    // Budget Pacing Logic
    // If we've spent 80% of budget but only 20% of the day has passed, bid less aggressively
    const dailyBudget = Number(candidate.campaign.dailyBudget);
    const spentToday = Number(candidate.campaign.spentToday);
    const percentBudgetSpent = spentToday / dailyBudget;

    let pacingMultiplier = 1.0;
    if (percentBudgetSpent > percentOfDayPassed * 1.5) {
      // Spending too fast - slow down by lowering bid aggressiveness
      pacingMultiplier = 0.5;
    } else if (percentBudgetSpent < percentOfDayPassed * 0.5) {
      // Spending too slow - be more aggressive
      pacingMultiplier = 1.2;
    }

    // Final Ad Rank calculation
    const effectiveBid = Number(candidate.maxCpcBid) * bidMultiplier * pacingMultiplier;
    const adRank = effectiveBid * qualityScore;

    return {
      ...candidate,
      qualityScore,
      effectiveBid,
      adRank
    };
  });

  // 3. Sort by Ad Rank descending
  scoredCandidates.sort((a, b) => b.adRank - a.adRank);

  // 4. Second-Price Auction Mechanics
  const winner = scoredCandidates[0];
  let actualCpc = winner.effectiveBid; // Default to max effective bid if no competitors

  if (scoredCandidates.length > 1) {
    const runnerUp = scoredCandidates[1];
    // Formula: (Runner Up Ad Rank / Winner Quality Score) + 0.01
    const secondPrice = (runnerUp.adRank / winner.qualityScore) + 0.01;
    actualCpc = Math.min(winner.effectiveBid, secondPrice);
  }

  // Ensure minimum bid floor is met
  const minBidFloor = Number(process.env.MIN_BID_FLOOR_INR || '1.00');
  actualCpc = Math.max(actualCpc, minBidFloor);
  
  // Cap actual CPC at the campaign's remaining budget for the day
  const remainingBudget = Number(winner.campaign.dailyBudget) - Number(winner.campaign.spentToday);
  if (actualCpc > remainingBudget) {
    actualCpc = remainingBudget;
  }

  // 5. Select Ad Creative from Winning Campaign
  const winningAd = winner.campaign.ads[0]; // Assuming 1 ad per campaign for MVP
  if (!winningAd) return null;

  // Cryptographically sign the impression token
  const impressionToken = generateImpressionToken(winner.campaignId, winningAd.id, actualCpc);

  return {
    adId: winningAd.id,
    campaignId: winner.campaignId,
    productId: winningAd.productId,
    headline: winningAd.headline,
    imageUrl: winningAd.imageUrl,
    targetUrl: winningAd.targetUrl,
    actualCpc,
    impressionToken
  };
}
