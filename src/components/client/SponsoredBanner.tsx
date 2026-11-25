'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { SponsoredAd } from './SponsoredProductTile';

interface SponsoredBannerProps {
  ad?: SponsoredAd;
  searchQuery?: string;
  placement?: string;
  apiUrl?: string;
  className?: string;
  onAdClick?: (ad: SponsoredAd) => void;
}

export function SponsoredBanner({
  ad: initialAd,
  searchQuery,
  placement = 'home_banner',
  apiUrl = '',
  className = '',
  onAdClick,
}: SponsoredBannerProps) {
  const [fetchedAd, setFetchedAd] = useState<SponsoredAd | null>(null);
  const [hasImpressed, setHasImpressed] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const ad = initialAd || fetchedAd;

  useEffect(() => {
    if (!initialAd && searchQuery) {
      fetch(`${apiUrl}/api/serve-ad?q=${encodeURIComponent(searchQuery)}&placement=${encodeURIComponent(placement)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.ad) {
            setFetchedAd(data.ad);
          }
        })
        .catch((err) => console.warn('[AdsManager] Failed to fetch banner ad:', err));
    }
  }, [initialAd, searchQuery, placement, apiUrl]);

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
              placement: ad.placement || placement,
              buyerSessionId: ad.buyerSessionId || 'web_session',
            }),
          }).catch((err) => console.warn('[AdsManager] Banner impression error:', err));
        }
      },
      { threshold: 0.5 }
    );

    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }

    return () => observer.disconnect();
  }, [ad, hasImpressed, placement, apiUrl]);

  const handleClick = async () => {
    if (!ad) return;

    try {
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
      console.warn('[AdsManager] Banner click error:', err);
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
      ref={bannerRef}
      onClick={handleClick}
      className={`relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-950 via-purple-950 to-slate-950 p-6 shadow-md hover:shadow-lg transition-all cursor-pointer ${className}`}
    >
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded bg-black/40 backdrop-blur-sm px-2 py-0.5 border border-amber-400/40 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
        <span>★</span> Sponsored
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-xl">
          <h3 className="text-xl md:text-2xl font-bold text-amber-100 mb-2">
            {ad.headline}
          </h3>
          <p className="text-sm text-gray-300">
            Exclusive collections curated on GoldGini Marketplace
          </p>
        </div>

        {ad.imageUrl && (
          <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-white/10 p-2">
            <img
              src={ad.imageUrl}
              alt={ad.headline}
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SponsoredBanner;
