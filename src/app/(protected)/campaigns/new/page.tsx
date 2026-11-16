'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Target, 
  Settings, 
  Image as ImageIcon, 
  CheckCircle2, 
  ShoppingBag, 
  Megaphone, 
  Plus, 
  X,
  Search,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import Link from 'next/link';
import LiveAdPreview from '@/components/LiveAdPreview';

export default function NewCampaignWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [ecommProducts, setEcommProducts] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [formData, setFormData] = useState({
    objective: 'SPONSORED_PRODUCTS',
    name: '',
    dailyBudget: '500',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    biddingStrategy: 'FIXED',
    
    // Sponsored Products & Display
    productId: '',
    
    // Display specific
    headline: '',
    imageUrl: '',
    audience: 'in_market',
    
    // Sponsored Brands specific
    brandLogoUrl: '',
    storeUrl: '',
    selectedProducts: [] as string[],
    
    // Targeting
    keywords: 'gold jewellery, 22k gold, designer earrings', 
    matchType: 'BROAD',
    negativeKeywords: 'free, fake, cheap',
    bidAmount: '4.50', 
  });

  useEffect(() => {
    async function fetchProducts() {
      setFetchingProducts(true);
      try {
        const res = await fetch('/api/ecomm/products');
        const data = await res.json();
        if (data.success && data.products) {
          setEcommProducts(data.products);
          if (data.products.length > 0 && !formData.productId) {
            setFormData(prev => ({
              ...prev,
              productId: (data.products[0].product_id || data.products[0].id)?.toString()
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setFetchingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProductSelect = (id: string) => {
    setFormData({ ...formData, productId: id });
  };

  const handleMultiProductSelect = (id: string) => {
    if (!id || formData.selectedProducts.includes(id) || formData.selectedProducts.length >= 3) return;
    setFormData({ ...formData, selectedProducts: [...formData.selectedProducts, id] });
  };

  const removeSelectedProduct = (id: string) => {
    setFormData({ ...formData, selectedProducts: formData.selectedProducts.filter(p => p !== id) });
  };

  const selectObjective = (obj: string) => {
    setFormData({ ...formData, objective: obj });
  };

  const addSuggestedKeyword = (kw: string) => {
    const list = formData.keywords ? formData.keywords.split(',').map(s => s.trim()) : [];
    if (!list.includes(kw)) {
      list.push(kw);
      setFormData({ ...formData, keywords: list.join(', ') });
    }
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
      const keywordsArray = formData.objective === 'DISPLAY' 
        ? [] 
        : formData.keywords.split(',').filter(k => k.trim()).map(k => ({
            keyword: k.trim(),
            matchType: formData.matchType as 'EXACT' | 'PHRASE' | 'BROAD',
            maxCpcBid: Number(formData.bidAmount) || 2
          }));

      let adsArray: any[] = [];
      
      if (formData.objective === 'SPONSORED_PRODUCTS') {
        const product = ecommProducts.find(p => (p.product_id || p.id)?.toString() === formData.productId);
        adsArray = [{
          productId: formData.productId,
          headline: product?.product_name || product?.name || product?.title || `Product #${formData.productId}`,
          description: product?.description?.substring(0, 500) || '',
          imageUrl: product?.image || product?.thumbnail || undefined,
          targetUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://goldgini.com'}/products/${formData.productId}`
        }];
      } else if (formData.objective === 'SPONSORED_BRANDS') {
        adsArray = [{
          productId: formData.selectedProducts[0] || 'brand',
          headline: formData.headline || formData.name,
          description: `Brand showcase featuring ${formData.selectedProducts.length} items`,
          imageUrl: formData.brandLogoUrl || undefined,
          targetUrl: formData.storeUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://goldgini.com'}/store`
        }];
      } else if (formData.objective === 'DISPLAY') {
        const product = ecommProducts.find(p => (p.product_id || p.id)?.toString() === formData.productId);
        adsArray = [{
          productId: formData.productId,
          headline: formData.headline || formData.name,
          description: `Display ad targeting: ${formData.audience}`,
          imageUrl: formData.imageUrl || undefined,
          targetUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://goldgini.com'}/products/${formData.productId}`
        }];
      }

      const payload = {
        name: formData.name || `Campaign - ${new Date().toLocaleDateString()}`,
        dailyBudget: Number(formData.dailyBudget),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        keywords: keywordsArray.length > 0 ? keywordsArray : [{ keyword: 'gold jewelry', matchType: 'BROAD' as const, maxCpcBid: Number(formData.bidAmount) || 2 }],
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
    { 
      id: 'SPONSORED_PRODUCTS', 
      icon: ShoppingBag, 
      title: 'Sponsored Products', 
      badge: 'High Conversion',
      desc: 'Appear on product search results and product detail pages when customers search for matching keywords.' 
    },
    { 
      id: 'SPONSORED_BRANDS', 
      icon: Megaphone, 
      title: 'Sponsored Brands', 
      badge: 'Brand Discovery',
      desc: 'Promote your brand headline, custom logo, and up to 3 featured products at the very top of search results.' 
    },
    { 
      id: 'DISPLAY', 
      icon: ImageIcon, 
      title: 'Sponsored Display', 
      badge: 'Visual Retargeting',
      desc: 'High-impact banner placements across categories and homepage targeting in-market shoppers.' 
    },
  ];

  const suggestedKeywords = [
    '24k gold coin', 'bridal choker necklace', 'diamond stud earrings', 
    'solitaire ring', 'gold bangles 22k', 'daily wear pendant'
  ];

  const getSteps = () => {
    if (formData.objective === 'SPONSORED_PRODUCTS') {
      return [
        { num: 1, title: 'Objective', icon: Target },
        { num: 2, title: 'Basics', icon: Settings },
        { num: 3, title: 'Product Picker', icon: ShoppingBag },
        { num: 4, title: 'Targeting & Bids', icon: Target },
      ];
    } else if (formData.objective === 'SPONSORED_BRANDS') {
      return [
        { num: 1, title: 'Objective', icon: Target },
        { num: 2, title: 'Basics', icon: Settings },
        { num: 3, title: 'Brand Creative', icon: ImageIcon },
        { num: 4, title: 'Targeting & Bids', icon: Target },
      ];
    } else {
      return [
        { num: 1, title: 'Objective', icon: Target },
        { num: 2, title: 'Basics', icon: Settings },
        { num: 3, title: 'Product & Banner', icon: ImageIcon },
        { num: 4, title: 'Audiences & Bids', icon: Target },
      ];
    }
  };

  const activeSteps = getSteps();
  const totalSteps = activeSteps.length;

  const currentSelectedProduct = ecommProducts.find(p => (p.product_id || p.id)?.toString() === formData.productId);
  const selectedBrandProducts = ecommProducts.filter(p => formData.selectedProducts.includes((p.product_id || p.id)?.toString()));

  const filteredProducts = ecommProducts.filter(p => {
    const title = (p.product_name || p.name || p.title || '').toLowerCase();
    return title.includes(productSearch.toLowerCase());
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/campaigns" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#4F23D6] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Campaigns
        </Link>
        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 border border-purple-200">
          Campaign Wizard
        </span>
      </div>

      <div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-gray-900">
          Create New <span className="text-[#4F23D6]">Ad Campaign</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">
          Configure real-time auction bids, targeting keywords, and live ad creatives.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="bg-white border-2 border-gray-900 p-4 shadow-[4px_4px_0px_0px_#110C24]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {activeSteps.map((s) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;

            return (
              <div
                key={s.num}
                className={`p-2.5 border-2 flex items-center space-x-2 transition-all ${
                  isActive
                    ? 'border-[#4F23D6] bg-purple-50 text-[#4F23D6] font-black shadow-[2px_2px_0px_0px_#4F23D6]'
                    : isCompleted
                    ? 'border-gray-900 bg-gray-900 text-white font-bold'
                    : 'border-gray-200 bg-gray-50 text-gray-400 font-bold'
                }`}
              >
                <div className={`w-6 h-6 flex items-center justify-center text-xs font-black shrink-0 ${
                  isCompleted ? 'bg-[#E1FF00] text-black' : isActive ? 'bg-[#4F23D6] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? '✓' : s.num}
                </div>
                <span className="text-xs uppercase tracking-tight truncate">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Split: Form (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Form Steps */}
        <div className="lg:col-span-7 bg-white border-2 border-gray-900 p-6 sm:p-8 shadow-[6px_6px_0px_0px_#110C24]">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-6 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={step === totalSteps ? handleSubmit : handleNext}>
            {/* STEP 1: OBJECTIVE */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                    Step 1: Choose Advertising Objective
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Select where and how your products will be presented to shoppers on GoldGini.
                  </p>
                </div>

                <div className="space-y-4">
                  {objectives.map((obj) => (
                    <div
                      key={obj.id}
                      onClick={() => selectObjective(obj.id)}
                      className={`p-5 border-2 cursor-pointer transition-all flex items-start space-x-4 ${
                        formData.objective === obj.id
                          ? 'border-[#4F23D6] bg-purple-50/60 shadow-[4px_4px_0px_0px_#4F23D6]'
                          : 'border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-3 shrink-0 ${
                        formData.objective === obj.id ? 'bg-[#4F23D6] text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        <obj.icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-sm uppercase tracking-wide text-gray-900">
                            {obj.title}
                          </h3>
                          <span className="text-[10px] bg-[#E1FF00] border border-black text-black font-black uppercase px-1.5 py-0.5">
                            {obj.badge}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                          {obj.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: BASICS */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                    Step 2: Campaign Settings & Budget
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Set campaign name, schedule, and daily spend limit.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Campaign Name *
                    </label>
                    <input
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Festive Gold Bangles Promo - Diwali"
                      className="w-full px-4 py-2.5 border-2 border-gray-900 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#4F23D6]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Daily Budget (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-500">₹</span>
                        <input
                          required
                          type="number"
                          min="100"
                          step="50"
                          name="dailyBudget"
                          value={formData.dailyBudget}
                          onChange={handleChange}
                          className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-900 text-xs font-black text-gray-900 focus:outline-none focus:border-[#4F23D6]"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Minimum daily budget is ₹100</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Bidding Strategy
                      </label>
                      <select
                        name="biddingStrategy"
                        value={formData.biddingStrategy}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 border-2 border-gray-900 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#4F23D6] bg-white"
                      >
                        <option value="FIXED">Fixed Bid (Strict CPC)</option>
                        <option value="DYNAMIC_DOWN">Dynamic - Down Only</option>
                        <option value="DYNAMIC_UP_DOWN">Dynamic - Up & Down (Optimal)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Start Date *
                      </label>
                      <input
                        required
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border-2 border-gray-900 text-xs font-bold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border-2 border-gray-900 text-xs font-bold text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PRODUCT PICKER / CREATIVE */}
            {step === 3 && (formData.objective === 'SPONSORED_PRODUCTS' || formData.objective === 'DISPLAY') && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                    Step 3: Select Product Catalog Item
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Choose the item from your store to advertise in this slot.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by product title or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border-2 border-gray-900 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#4F23D6]"
                  />
                </div>

                {/* Product Grid / Cards */}
                {fetchingProducts ? (
                  <div className="p-8 text-center text-xs font-bold text-[#4F23D6] animate-pulse">
                    Connecting to catalog database...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-6 bg-gray-50 border border-gray-200 text-center text-xs text-gray-500 font-bold">
                    No products matched your search. Try another keyword.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 p-2 divide-y divide-gray-100">
                    {filteredProducts.map((p) => {
                      const id = (p.product_id || p.id)?.toString();
                      const name = p.product_name || p.name || p.title || `Item #${id}`;
                      const price = p.price || p.sale_price || '999';
                      const isSelected = formData.productId === id;

                      return (
                        <div
                          key={id}
                          onClick={() => handleProductSelect(id)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-50 border-2 border-[#4F23D6]'
                              : 'hover:bg-gray-50 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 border border-gray-200 shrink-0 overflow-hidden">
                              <img
                                src={p.image || p.image_url || p.thumbnail || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200'}
                                alt="Product"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900 line-clamp-1">{name}</p>
                              <span className="text-xs font-black text-[#4F23D6]">₹{price}</span>
                            </div>
                          </div>
                          <div className={`px-2.5 py-1 text-[10px] font-black uppercase ${
                            isSelected ? 'bg-[#4F23D6] text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {isSelected ? 'Selected' : 'Select'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Display Specific Headline if Display */}
                {formData.objective === 'DISPLAY' && (
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Banner Headline Text
                    </label>
                    <input
                      name="headline"
                      value={formData.headline}
                      onChange={handleChange}
                      placeholder="e.g. Handcrafted 24K Bridal Sets — Flat 25% Off This Week"
                      className="w-full px-3 py-2 border-2 border-gray-900 text-xs font-bold text-gray-900"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: SPONSORED BRANDS */}
            {step === 3 && formData.objective === 'SPONSORED_BRANDS' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                    Step 3: Brand Assets & Multi-Product Feature
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Upload your official brand logo and pick up to 3 showcase items.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Brand Logo URL
                    </label>
                    <input
                      name="brandLogoUrl"
                      value={formData.brandLogoUrl}
                      onChange={handleChange}
                      placeholder="https://.../brand-logo.png"
                      className="w-full px-3 py-2 border-2 border-gray-900 text-xs font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Brand Headline
                    </label>
                    <input
                      name="headline"
                      value={formData.headline}
                      onChange={handleChange}
                      placeholder="e.g. Royal Heritage Gold Collection"
                      className="w-full px-3 py-2 border-2 border-gray-900 text-xs font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Selected Featured Products ({formData.selectedProducts.length}/3)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {ecommProducts.slice(0, 6).map((p) => {
                        const id = (p.product_id || p.id)?.toString();
                        const isChosen = formData.selectedProducts.includes(id);

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => isChosen ? removeSelectedProduct(id) : handleMultiProductSelect(id)}
                            className={`p-2 border-2 text-left text-xs font-bold flex flex-col justify-between ${
                              isChosen ? 'border-[#4F23D6] bg-purple-50 text-[#4F23D6]' : 'border-gray-200 text-gray-700 hover:border-gray-900'
                            }`}
                          >
                            <span className="truncate">{p.product_name || p.name || p.title}</span>
                            <span className="text-[10px] uppercase font-black mt-1">
                              {isChosen ? '✓ Added' : '+ Add'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: TARGETING & BIDS */}
            {step === totalSteps && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                    Step 4: Target Keywords & CPC Bids
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Keywords connect your ad to active shoppers entering search queries.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Keywords Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Target Keywords (Comma Separated) *
                    </label>
                    <textarea
                      required
                      name="keywords"
                      rows={3}
                      value={formData.keywords}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-900 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#4F23D6]"
                      placeholder="gold necklace, 22k gold, bridal jewellery"
                    />
                  </div>

                  {/* Quick Suggestions Chips */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1.5">
                      + Click to Add High-Intent Keyword Suggestions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedKeywords.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => addSuggestedKeyword(kw)}
                          className="px-2 py-1 bg-gray-100 hover:bg-[#E1FF00] text-gray-800 text-[10px] font-bold border border-gray-300 transition-colors"
                        >
                          + {kw}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Match Type & Max Bid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Keyword Match Type
                      </label>
                      <select
                        name="matchType"
                        value={formData.matchType}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 border-2 border-gray-900 text-xs font-bold text-gray-900 bg-white"
                      >
                        <option value="BROAD">Broad Match (Maximum Reach)</option>
                        <option value="PHRASE">Phrase Match (Order Sensitive)</option>
                        <option value="EXACT">Exact Match (Highest Conversion)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Max CPC Bid (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-500">₹</span>
                        <input
                          required
                          type="number"
                          step="0.25"
                          min="0.5"
                          name="bidAmount"
                          value={formData.bidAmount}
                          onChange={handleChange}
                          className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-900 text-xs font-black text-gray-900"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Second-price RTB: You only pay ₹0.01 above runner-up</p>
                    </div>
                  </div>

                  {/* Negative Keywords */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Negative Keywords (Exclude Searches)
                    </label>
                    <input
                      name="negativeKeywords"
                      value={formData.negativeKeywords}
                      onChange={handleChange}
                      placeholder="e.g. cheap, free, artificial, replica"
                      className="w-full px-3 py-2 border border-gray-300 text-xs font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 mt-8 border-t-2 border-gray-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 border-2 border-gray-900 text-gray-900 text-xs font-black uppercase tracking-wider hover:bg-gray-100 transition-colors"
                >
                  ← Back
                </button>
              ) : <div />}

              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-[#4F23D6] hover:bg-[#3815a8] text-white text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#E1FF00] hover:shadow-[6px_6px_0px_0px_#E1FF00] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Submitting to Moderation...' : step === totalSteps ? '🚀 Submit & Launch Campaign' : 'Continue Next Step →'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Interactive Ad Preview */}
        <div className="lg:col-span-5">
          <LiveAdPreview
            objective={formData.objective}
            name={formData.name}
            headline={formData.headline}
            imageUrl={formData.imageUrl}
            brandLogoUrl={formData.brandLogoUrl}
            selectedProduct={currentSelectedProduct}
            selectedProductsList={selectedBrandProducts}
            bidAmount={formData.bidAmount}
          />
        </div>
      </div>
    </div>
  );
}
