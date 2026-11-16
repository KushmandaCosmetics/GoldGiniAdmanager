'use client';

import { useState } from 'react';
import { Smartphone, Monitor, ShoppingBag, Star, Sparkles, Tag, ArrowUpRight } from 'lucide-react';

interface LiveAdPreviewProps {
  objective: string;
  name?: string;
  headline?: string;
  imageUrl?: string;
  brandLogoUrl?: string;
  selectedProduct?: any;
  selectedProductsList?: any[];
  bidAmount?: string;
}

export default function LiveAdPreview({
  objective,
  name,
  headline,
  imageUrl,
  brandLogoUrl,
  selectedProduct,
  selectedProductsList = [],
  bidAmount,
}: LiveAdPreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const defaultImage = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60';
  const displayImage = imageUrl || selectedProduct?.image_url || defaultImage;
  const displayHeadline = headline || name || 'Exclusive Beauty & Gold Deals on GoldGini';
  const productTitle = selectedProduct?.title || selectedProduct?.product_name || 'Premium Radiance Hydrating Formula';
  const productPrice = selectedProduct?.price || selectedProduct?.sale_price || '1,499';
  const mrpPrice = selectedProduct?.mrp || '2,499';

  return (
    <div className="bg-white border-2 border-gray-900 shadow-[6px_6px_0px_0px_#4F23D6] overflow-hidden sticky top-8">
      {/* Header bar */}
      <div className="bg-[#110C24] p-4 flex items-center justify-between text-white border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#E1FF00]" />
          <span className="text-xs font-black uppercase tracking-wider">Live Ad Placement Preview</span>
        </div>
        <div className="flex items-center space-x-1 bg-white/10 p-0.5 border border-white/20">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`p-1.5 transition-colors ${
              device === 'desktop' ? 'bg-[#E1FF00] text-black' : 'text-gray-300 hover:text-white'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`p-1.5 transition-colors ${
              device === 'mobile' ? 'bg-[#E1FF00] text-black' : 'text-gray-300 hover:text-white'
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Surface */}
      <div className="p-6 bg-gray-100 flex items-center justify-center min-h-[380px]">
        <div
          className={`transition-all duration-300 ${
            device === 'mobile' ? 'w-[320px]' : 'w-full max-w-[420px]'
          }`}
        >
          {/* Case 1: Sponsored Products Card */}
          {(!objective || objective === 'SPONSORED_PRODUCTS' || objective === 'SEARCH') && (
            <div className="bg-white border-2 border-gray-900 shadow-[4px_4px_0px_0px_#110C24] p-3 group relative">
              {/* Sponsored Pill */}
              <div className="absolute top-2 left-2 z-10 bg-[#E1FF00] border border-black text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 shadow-[1px_1px_0px_0px_#000]">
                Sponsored
              </div>

              {/* Product Image */}
              <div className="w-full h-44 bg-gray-50 border border-gray-200 overflow-hidden relative mb-3">
                <img
                  src={displayImage}
                  alt="Product"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-1 text-amber-500 text-xs">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold text-gray-800 text-[11px]">4.8</span>
                  <span className="text-gray-400 text-[10px]">(128 reviews)</span>
                </div>

                <h4 className="font-black text-sm text-gray-900 line-clamp-2 leading-tight">
                  {productTitle}
                </h4>

                <div className="flex items-baseline space-x-2 pt-1">
                  <span className="text-lg font-black text-gray-900">₹{productPrice}</span>
                  <span className="text-xs text-gray-400 line-through">₹{mrpPrice}</span>
                  <span className="text-xs font-black text-emerald-600">40% OFF</span>
                </div>

                <button
                  type="button"
                  className="w-full mt-3 py-2 bg-[#4F23D6] hover:bg-[#3b17a8] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1 transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          )}

          {/* Case 2: Sponsored Display Banner */}
          {objective === 'DISPLAY' && (
            <div className="bg-gradient-to-r from-[#110C24] via-[#21144a] to-[#4F23D6] text-white border-2 border-gray-900 p-4 shadow-[4px_4px_0px_0px_#E1FF00] relative overflow-hidden">
              <span className="bg-[#E1FF00] text-black text-[9px] font-black uppercase px-1.5 py-0.5 tracking-tight inline-block mb-2">
                Sponsored Banner
              </span>
              <div className="grid grid-cols-3 gap-3 items-center">
                <div className="col-span-2 space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-tight text-white line-clamp-2">
                    {displayHeadline}
                  </h4>
                  <p className="text-[10px] text-purple-200">Featured collection on GoldGini Store</p>
                  <div className="inline-flex items-center space-x-1 bg-[#E1FF00] text-black text-xs font-black px-2.5 py-1 uppercase tracking-wide">
                    <span>Shop Now</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
                <div className="col-span-1 h-20 bg-black/40 border border-white/20 overflow-hidden">
                  <img src={displayImage} alt="Ad creative" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          )}

          {/* Case 3: Sponsored Brands Header */}
          {objective === 'SPONSORED_BRANDS' && (
            <div className="bg-white border-2 border-gray-900 shadow-[4px_4px_0px_0px_#110C24] p-3 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-black rounded-none border border-gray-300 flex items-center justify-center text-xs font-black text-[#E1FF00]">
                    {brandLogoUrl ? (
                      <img src={brandLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      'GG'
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#4F23D6] block">
                      Sponsored Brand
                    </span>
                    <h4 className="text-xs font-black text-gray-900">{name || 'Official GoldGini Brand'}</h4>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 font-bold">Visit Store →</span>
              </div>

              {/* 3 product mini strip */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((idx) => {
                  const prod = selectedProductsList[idx - 1];
                  return (
                    <div key={idx} className="border border-gray-200 p-1.5 text-center bg-gray-50">
                      <div className="w-full h-14 bg-gray-200 mb-1 overflow-hidden">
                        <img
                          src={prod?.image_url || displayImage}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-[9px] font-bold text-gray-800 truncate">
                        {prod?.title || `Product #${idx}`}
                      </div>
                      <div className="text-[10px] font-black text-[#4F23D6]">
                        ₹{prod?.price || '999'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer stats strip */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-600 font-bold">
        <span>Target Placement: {objective === 'DISPLAY' ? 'Banner Slots' : 'Search & Category Grid'}</span>
        {bidAmount && (
          <span className="text-[#4F23D6] flex items-center space-x-1">
            <Tag className="w-3 h-3" />
            <span>Target Bid: ₹{bidAmount}/click</span>
          </span>
        )}
      </div>
    </div>
  );
}
