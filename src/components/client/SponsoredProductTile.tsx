'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface SponsoredAd {
  adId: number;
  campaignId: number;
  productId: string;
  headline: string;
  imageUrl?: string;
  targetUrl?: string;
  actualCpc: number;
  impressionToken: string;
  placement?: string;
  buyerSessionId?: string;
}

interface SponsoredProductTileProps {
  ad: SponsoredAd;
  apiUrl?: string;
  className?: string;
  onAdClick?: (ad: SponsoredAd) => void;
}

export function SponsoredProductTile({
  ad,
  apiUrl = '',
  className = '',
  onAdClick,
}: SponsoredProductTileProps) {
  const [hasImpressed, setHasImpressed] = useState(false);
  const tileRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver to record viewable impression only when 50% visible in viewport
  useEffect(() => {
    if (!ad || hasImpressed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasImpressed) {
          setHasImpressed(true);
          fetch(`${apiUrl}/api/events/impression`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: ad.campaignId,
              adId: ad.adId,
              placement: ad.placement || 'search_results',
              buyerSessionId: ad.buyerSessionId || 'web_session',
            }),
          }).catch((err) => console.warn('[AdsManager] Impression error:', err));
        }
      },
      { threshold: 0.5 }
    );

    if (tileRef.current) {
      observer.observe(tileRef.current);
    }

    return () => observer.disconnect();
  }, [ad, hasImpressed, apiUrl]);

  const handleClick = async () => {
    try {
      // Fire CPC click event to backend engine
      await fetch(`${apiUrl}/api/events/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: ad.campaignId,
          adId: ad.adId,
          actualCpc: ad.actualCpc,
          impressionToken: ad.impressionToken,
          buyerSessionId: ad.buyerSessionId || 'web_session',
        }),
      });
    } catch (err) {
      console.warn('[AdsManager] Click event error:', err);
    }

    if (onAdClick) {
      onAdClick(ad);
    } else if (ad.targetUrl) {
      window.location.href = ad.targetUrl;
    }
  };

  if (!ad) return null;

  return (
    <div
      ref={tileRef}
      onClick={handleClick}
      className={`group relative flex flex-col rounded-xl border border-amber-200/80 bg-white p-3 shadow-sm hover:shadow-md transition-all cursor-pointer ${className}`}
    >
      {/* Sponsored Pill */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 border border-amber-200 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
        <span>★</span> Sponsored
      </div>

      {/* Image creative */}
      <div className="relative mb-3 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-amber-50/50">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.headline}
            className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="text-gray-300">No Image</div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <h4 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-amber-800">
          {ad.headline}
        </h4>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Featured Seller
          </span>
          <span className="font-bold text-purple-700 group-hover:underline">
            View &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}

export default SponsoredProductTile;
