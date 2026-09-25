'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, Settings, Image as ImageIcon, CheckCircle2, ShoppingBag, Megaphone, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function NewCampaignWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [ecommProducts, setEcommProducts] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);

  const [formData, setFormData] = useState({
    objective: '',
    name: '',
    dailyBudget: '',
    startDate: '',
    endDate: '',
    biddingStrategy: 'FIXED',
    
    // Sponsored Products & Display
    productId: '',
    
    // Display specific
    headline: '',
    imageUrl: '',
    audience: '',
    
    // Sponsored Brands specific
    brandLogoUrl: '',
    storeUrl: '',
    selectedProducts: [] as string[],
    
    // Targeting
    keywords: '', 
    matchType: 'BROAD',
    negativeKeywords: '',
    bidAmount: '', 
  });

  useEffect(() => {
    async function fetchProducts() {
      setFetchingProducts(true);
      try {
        const res = await fetch('/api/ecomm/products');
        const data = await res.json();
        if (data.success && data.products) {
          setEcommProducts(data.products);
        }
      } catch (err) {
        console.error("Failed to fetch products from ecomm2", err);
      } finally {
        setFetchingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, productId: e.target.value });
  };

  const handleMultiProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val || formData.selectedProducts.includes(val) || formData.selectedProducts.length >= 3) return;
    setFormData({ ...formData, selectedProducts: [...formData.selectedProducts, val] });
  };

  const removeSelectedProduct = (id: string) => {
    setFormData({ ...formData, selectedProducts: formData.selectedProducts.filter(p => p !== id) });
  };

  const selectObjective = (obj: string) => {
    setFormData({ ...formData, objective: obj });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Build the correct keywords array for the API
      const keywordsArray = formData.objective === 'DISPLAY' 
        ? [] 
        : formData.keywords.split(',').filter(k => k.trim()).map(k => ({
            keyword: k.trim(),
            matchType: formData.matchType as 'EXACT' | 'PHRASE' | 'BROAD',
            maxCpcBid: Number(formData.bidAmount)
          }));

      // Build the correct ads array based on objective
      let adsArray: any[] = [];
      
      if (formData.objective === 'SPONSORED_PRODUCTS') {
        const product = ecommProducts.find(p => (p.product_id || p.id)?.toString() === formData.productId);
        adsArray = [{
          productId: formData.productId,
          headline: product?.product_name || product?.name || product?.title || `Product #${formData.productId}`,
          description: product?.description?.substring(0, 500) || '',
          imageUrl: product?.image || product?.thumbnail || undefined,
          targetUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://goldgini.com'}/product/${formData.productId}`
        }];
      } else if (formData.objective === 'SPONSORED_BRANDS') {
        adsArray = [{
          productId: formData.selectedProducts[0] || 'brand',
          headline: formData.headline,
          description: `Brand showcase featuring ${formData.selectedProducts.length} products`,
          imageUrl: formData.brandLogoUrl || undefined,
          targetUrl: formData.storeUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://goldgini.com'}/store`
        }];
      } else if (formData.objective === 'DISPLAY') {
        const product = ecommProducts.find(p => (p.product_id || p.id)?.toString() === formData.productId);
        adsArray = [{
          productId: formData.productId,
          headline: formData.headline,
          description: `Display ad targeting: ${formData.audience}`,
          imageUrl: formData.imageUrl || undefined,
          targetUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://goldgini.com'}/product/${formData.productId}`
        }];
      }

      // Build the API payload matching the Zod schema
      const payload = {
        name: formData.name,
        dailyBudget: Number(formData.dailyBudget),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        keywords: keywordsArray.length > 0 ? keywordsArray : [{ keyword: 'general', matchType: 'BROAD' as const, maxCpcBid: Number(formData.bidAmount) || 1 }],
        ads: adsArray,
        objective: formData.objective,
        biddingStrategy: formData.biddingStrategy,
        negativeKeywords: formData.negativeKeywords ? formData.negativeKeywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        audience: formData.audience || undefined,
      };

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        router.push('/campaigns');
      } else {
        setError(data.error || 'Failed to create campaign');
      }
    } catch (err) {
      setError("Failed to create campaign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const objectives = [
    { id: 'SPONSORED_PRODUCTS', icon: ShoppingBag, title: 'Sponsored Products', desc: 'Promote product listings to shoppers actively searching with related keywords or viewing similar products.' },
    { id: 'SPONSORED_BRANDS', icon: Megaphone, title: 'Sponsored Brands', desc: 'Drive brand discovery. Showcase your brand and products where shoppers browse and search.' },
    { id: 'DISPLAY', icon: ImageIcon, title: 'Display Ads', desc: 'Reach, re-engage, and convert customers wherever they spend time using their past behaviors and interests.' },
  ];

  // Dynamic Steps logic
  const getSteps = () => {
    if (formData.objective === 'SPONSORED_PRODUCTS') {
      return [
        { num: 1, title: 'Objective', icon: Target },
        { num: 2, title: 'Basics', icon: Settings },
        { num: 3, title: 'Product', icon: ShoppingBag },
        { num: 4, title: 'Targeting', icon: Target },
      ];
    } else if (formData.objective === 'SPONSORED_BRANDS') {
      return [
        { num: 1, title: 'Objective', icon: Target },
        { num: 2, title: 'Basics', icon: Settings },
        { num: 3, title: 'Brand Creative', icon: ImageIcon },
        { num: 4, title: 'Targeting', icon: Target },
      ];
    } else if (formData.objective === 'DISPLAY') {
      return [
        { num: 1, title: 'Objective', icon: Target },
        { num: 2, title: 'Basics', icon: Settings },
        { num: 3, title: 'Product', icon: ShoppingBag },
        { num: 4, title: 'Creative', icon: ImageIcon },
        { num: 5, title: 'Audiences', icon: Target },
      ];
    }
    return [
      { num: 1, title: 'Objective', icon: Target },
      { num: 2, title: 'Basics', icon: Settings },
      { num: 3, title: 'Creative', icon: ImageIcon },
      { num: 4, title: 'Targeting', icon: Target },
    ];
  };

  const activeSteps = getSteps();
  const totalSteps = activeSteps.length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Link href="/campaigns" className="inline-flex items-center text-gray-500 hover:text-[#4F23D6] font-bold uppercase tracking-wide transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Campaigns
      </Link>

      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Create <span className="text-[#4F23D6]">Campaign</span></h1>
        <p className="text-gray-500 mt-2 font-medium">Launch a new advertising campaign</p>
      </div>

      {/* Progress Bar */}
      <div className="flex justify-between relative mb-12 mt-8">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-[#4F23D6] -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ width: totalSteps > 1 ? `${((step - 1) / (totalSteps - 1)) * 100}%` : '0%' }}
        />
        
        {activeSteps.map((s) => {
          const isActive = step === s.num;
          const isCompleted = step > s.num;
          const isLocked = !formData.objective && s.num > 1;

          return (
            <div key={s.num} className={`relative z-10 flex flex-col items-center transition-all duration-500 ${isLocked ? 'opacity-30 blur-[1px] grayscale' : ''}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors ${
                isActive ? 'bg-white border-[#4F23D6] text-[#4F23D6] shadow-[0_0_15px_rgba(79,35,214,0.3)]' : 
                isCompleted ? 'bg-[#4F23D6] border-[#4F23D6] text-white' : 
                'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={`absolute -bottom-8 font-bold uppercase tracking-wider text-xs whitespace-nowrap ${
                isActive ? 'text-[#4F23D6]' : isCompleted ? 'text-gray-900' : 'text-gray-400'
              }`}>{s.title}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 p-8 shadow-sm mt-12 relative overflow-hidden">
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={step === totalSteps ? handleSubmit : handleNext} className="relative z-10">
          
          {/* STEP 1: OBJECTIVE */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-wide text-gray-900 mb-6">Choose your objective</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {objectives.map((obj) => (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => selectObjective(obj.id)}
                    className={`flex flex-col items-start p-6 border-2 transition-all text-left group ${
                      formData.objective === obj.id 
                        ? 'border-[#4F23D6] bg-purple-50' 
                        : 'border-gray-100 hover:border-[#4F23D6] hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-3 rounded-full mb-4 transition-colors ${
                      formData.objective === obj.id 
                        ? 'bg-[#4F23D6] text-white' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-[#4F23D6] group-hover:text-white'
                    }`}>
                      <obj.icon className="w-6 h-6" />
                    </div>
                    <h3 className={`font-bold uppercase tracking-wide mb-2 ${
                      formData.objective === obj.id ? 'text-[#4F23D6]' : 'text-gray-900'
                    }`}>{obj.title}</h3>
                    <p className="text-sm text-gray-500 font-medium">{obj.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: BASICS (All Objectives) */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-wide text-gray-900 mb-6">Campaign Settings</h2>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Campaign Name</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6] transition-colors" placeholder="e.g. Summer Collection" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Daily Budget (₹)</label>
                  <input required type="number" min="5" name="dailyBudget" value={formData.dailyBudget} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6] transition-colors font-mono" placeholder="500.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Start Date</label>
                  <input required type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6] transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">End Date (Optional)</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Bidding Strategy</label>
                  <select name="biddingStrategy" value={formData.biddingStrategy} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6] transition-colors">
                    <option value="FIXED">Fixed Bids</option>
                    <option value="DYNAMIC_DOWN">Dynamic — Down Only</option>
                    <option value="DYNAMIC_UP_DOWN">Dynamic — Up & Down</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.biddingStrategy === 'FIXED' && 'Your bid stays exactly as set.'}
                    {formData.biddingStrategy === 'DYNAMIC_DOWN' && 'Bid is lowered when conversion is unlikely.'}
                    {formData.biddingStrategy === 'DYNAMIC_UP_DOWN' && 'Bid is raised when conversion is likely, lowered when not.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SPONSORED PRODUCTS / DISPLAY - Select Single Product */}
          {step === 3 && (formData.objective === 'SPONSORED_PRODUCTS' || formData.objective === 'DISPLAY') && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-wide text-gray-900 mb-6">Select Product</h2>
              <div className="p-6 bg-blue-50 border border-blue-100 mb-6 rounded-md">
                <label className="block text-xs font-bold text-[#4F23D6] uppercase tracking-wider mb-2 flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-2" /> Choose Product to Advertise
                </label>
                {fetchingProducts ? (
                  <p className="text-gray-500 text-sm font-medium animate-pulse">Fetching your products from store...</p>
                ) : (
                  <select 
                    required
                    className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6] transition-colors"
                    value={formData.productId}
                    onChange={handleProductSelect}
                  >
                    <option value="">-- Select a Product --</option>
                    {ecommProducts.map((p: any) => {
                      const id = p.product_id || p.id;
                      const name = p.product_name || p.name || p.title || `Product #${id}`;
                      const price = p.price || p.sale_price || '';
                      return (
                        <option key={id} value={id}>
                          {name} {price ? `— ₹${price}` : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
                {formData.objective === 'SPONSORED_PRODUCTS' && (
                  <p className="text-xs text-gray-500 mt-2 font-medium">Your ad creative will be automatically generated using this product&apos;s default image and title.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: SPONSORED BRANDS - Brand Creative */}
          {step === 3 && formData.objective === 'SPONSORED_BRANDS' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-wide text-gray-900 mb-6">Brand Creative</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Brand Logo URL</label>
                  <input required name="brandLogoUrl" value={formData.brandLogoUrl} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6]" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Custom Headline</label>
                  <input required name="headline" value={formData.headline} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6]" placeholder="Discover our new collection" />
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 border border-gray-200 mt-6">
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Select up to 3 Products to Feature</label>
                {fetchingProducts ? (
                  <p className="text-gray-500 text-sm">Loading products...</p>
                ) : (
                  <div className="flex items-center space-x-2">
                    <select 
                      className="flex-1 bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6]"
                      onChange={handleMultiProductSelect}
                      value=""
                      disabled={formData.selectedProducts.length >= 3}
                    >
                      <option value="">-- Add Product to Carousel --</option>
                      {ecommProducts.map((p: any) => {
                        const id = p.product_id || p.id;
                        const name = p.product_name || p.name || p.title || `Product #${id}`;
                        return (
                          <option key={id} value={id} disabled={formData.selectedProducts.includes(id?.toString())}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                
                {formData.selectedProducts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.selectedProducts.map(id => {
                      const p = ecommProducts.find(prod => (prod.product_id || prod.id)?.toString() === id);
                      const name = p?.product_name || p?.name || p?.title || `Product #${id}`;
                      return (
                        <div key={id} className="flex justify-between items-center bg-white p-3 border border-gray-200">
                          <span className="text-sm font-medium text-gray-700">{name}</span>
                          <button type="button" onClick={() => removeSelectedProduct(id)} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                <div className="mt-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">OR</p>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Link directly to your Storefront</label>
                  <input name="storeUrl" value={formData.storeUrl} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6]" placeholder="https://goldgini.com/store/my-brand" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DISPLAY - Custom Creative */}
          {step === 4 && formData.objective === 'DISPLAY' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-wide text-gray-900 mb-6">Custom Creative</h2>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Lifestyle Image URL</label>
                <input required name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6]" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Headline</label>
                <input required name="headline" value={formData.headline} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6]" placeholder="Ad headline..." />
              </div>
            </div>
          )}

          {/* FINAL STEP: TARGETING */}
          {(step === totalSteps && formData.objective !== '') && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-wide text-gray-900 mb-6">Targeting & Bidding</h2>
              
              {formData.objective === 'DISPLAY' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Target Audience</label>
                  <select required name="audience" value={formData.audience} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6] mb-6">
                    <option value="">-- Select Audience --</option>
                    <option value="retargeting_views">Shoppers who viewed my products</option>
                    <option value="retargeting_cart">Shoppers who abandoned cart</option>
                    <option value="in_market">In-market for fine jewelry</option>
                  </select>
                  
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Negative Audiences / Placements</label>
                  <input name="negativeKeywords" value={formData.negativeKeywords} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6]" placeholder="e.g. existing_customers" />
                  <p className="text-xs text-gray-500 mt-1 mb-6">Prevent ads from showing to these audiences.</p>
                </div>
              ) : (
                <>
                  <div className="bg-purple-50 border border-purple-200 p-6 rounded-md mb-6">
                    <p className="text-purple-900 text-sm font-medium">When users search for these keywords, they will enter a second-price auction. You only pay ₹0.01 more than the next highest bidder.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Keywords (Comma separated)</label>
                    <input required name="keywords" value={formData.keywords} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6] transition-colors" placeholder="gold ring, engagement ring, 24k gold" />
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Match Type</label>
                    <select name="matchType" value={formData.matchType} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6] transition-colors">
                      <option value="BROAD">Broad Match — Widest reach, includes related terms</option>
                      <option value="PHRASE">Phrase Match — Phrase must appear in order</option>
                      <option value="EXACT">Exact Match — Only exact keyword matches</option>
                    </select>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Negative Keywords</label>
                    <input name="negativeKeywords" value={formData.negativeKeywords} onChange={handleChange} className="w-full bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6] transition-colors" placeholder="e.g. cheap, free, fake" />
                    <p className="text-xs text-gray-500 mt-1">Prevent your ad from showing when these terms are searched.</p>
                  </div>
                </>
              )}

              <div className="mt-6">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Max Bid per Click (₹)</label>
                <input required type="number" min="0.1" step="0.1" name="bidAmount" value={formData.bidAmount} onChange={handleChange} className="w-full max-w-xs bg-white border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4F23D6] transition-colors font-mono" placeholder="5.00" />
                <p className="text-xs text-gray-400 mt-1">You&apos;ll never pay more than this per click. In a second-price auction, you typically pay less.</p>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between pt-6 border-t border-gray-200">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold uppercase tracking-wide hover:bg-gray-50 transition-colors">
                Back
              </button>
            ) : <div />}
            
            {step === 1 ? (
              <button 
                type="button" 
                onClick={() => setStep(2)}
                disabled={!formData.objective}
                className="px-8 py-3 bg-[#4F23D6] text-white font-bold uppercase tracking-wide hover:bg-[#3b19a3] transition-colors disabled:opacity-50"
              >
                Next Step
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-3 bg-[#4F23D6] text-white font-bold uppercase tracking-wide hover:bg-[#3b19a3] transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : step === totalSteps ? 'Launch Campaign' : 'Next Step'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
