import Link from 'next/link';
import { ArrowRight, BarChart2, Target, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#110C24] text-white selection:bg-[#E1FF00] selection:text-[#110C24] overflow-hidden relative">
      
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#4F23D6]/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#E1FF00]/10 rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
          GoldGini <span className="text-[#E1FF00]">Ad Manager</span>
        </h1>
        <div className="flex space-x-6 items-center">
          <Link href="/login" className="text-gray-300 hover:text-white font-bold uppercase tracking-wide transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="bg-[#E1FF00] text-[#110C24] px-6 py-2 font-bold uppercase tracking-wide hover:bg-white transition-all shadow-[4px_4px_0px_0px_#4F23D6] hover:shadow-[6px_6px_0px_0px_#4F23D6] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#4F23D6]">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="inline-block mb-6 px-4 py-1 border border-white/20 bg-white/5 backdrop-blur-md rounded-full">
          <p className="text-sm font-bold text-[#E1FF00] uppercase tracking-widest">The Premier Advertising Platform</p>
        </div>
        
        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[1.1] mb-8 drop-shadow-2xl">
          Supercharge your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E1FF00] to-yellow-200 drop-shadow-[0_0_20px_rgba(225,255,0,0.3)]">
            Product Sales
          </span>
        </h2>
        
        <p className="text-xl md:text-2xl text-purple-200 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
          Put your products directly in front of buyers exactly when they are searching for them. Use our Real-Time Bidding engine to dominate the GoldGini marketplace.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link href="/register" className="w-full sm:w-auto bg-[#E1FF00] text-[#110C24] px-8 py-4 font-black uppercase tracking-wide text-lg flex items-center justify-center group transition-all shadow-[6px_6px_0px_0px_#4F23D6] hover:shadow-[8px_8px_0px_0px_#4F23D6] hover:-translate-y-1 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#4F23D6]">
            Start Advertising
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="w-full sm:w-auto border-2 border-white/30 text-white hover:border-white px-8 py-4 font-bold uppercase tracking-wide text-lg hover:bg-white/5 transition-all">
            Seller Login
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 bg-black/40 border-y border-white/10 backdrop-blur-xl py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="space-y-4">
              <div className="w-16 h-16 bg-[#4F23D6]/20 border border-[#4F23D6] flex items-center justify-center">
                <Target className="w-8 h-8 text-[#E1FF00]" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-wide text-white">Precision Targeting</h3>
              <p className="text-gray-400 font-medium leading-relaxed">
                Bid on exact keywords that buyers are searching for. Only pay when a user actually clicks your ad and views your product.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-[#4F23D6]/20 border border-[#4F23D6] flex items-center justify-center">
                <Zap className="w-8 h-8 text-[#E1FF00]" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-wide text-white">Real-Time Bidding</h3>
              <p className="text-gray-400 font-medium leading-relaxed">
                Our Lightning-fast second price auction ensures you only ever pay 1 cent more than the next highest bidder. Win efficiently.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-[#4F23D6]/20 border border-[#4F23D6] flex items-center justify-center">
                <BarChart2 className="w-8 h-8 text-[#E1FF00]" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-wide text-white">Advanced Analytics</h3>
              <p className="text-gray-400 font-medium leading-relaxed">
                Track your Return on Ad Spend (ROAS) with beautiful real-time dashboards showing exactly how many clicks and impressions you generated.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
