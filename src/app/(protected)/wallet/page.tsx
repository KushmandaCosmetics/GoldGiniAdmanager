'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  History, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet as WalletIcon,
  ShieldCheck,
  Download,
  Filter,
  Sparkles,
  Zap,
  RefreshCw
} from 'lucide-react';

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      if (data.success) {
        setBalance(Number(data.balance) || 0);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(topUpAmount);
    if (!topUpAmount || isNaN(num) || num < 100) {
      alert("Minimum top-up amount is ₹100");
      return;
    }
    
    setIsToppingUp(true);
    
    try {
      const res = await initializeRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setIsToppingUp(false);
        return;
      }

      const orderRes = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: num })
      });
      
      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert(orderData.error || "Failed to create payment order");
        setIsToppingUp(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: "GoldGini Ads",
        description: `Ad Credits Recharge (₹${num})`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/wallet/topup', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: num
              })
            });
            
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setTopUpAmount('1000');
              fetchWalletData();
              alert(`Successfully credited ₹${num} to your ad balance!`);
            } else {
              alert(verifyData.error || 'Payment verification failed');
            }
          } catch (err) {
            alert("Payment verification error");
          } finally {
            setIsToppingUp(false);
          }
        },
        theme: {
          color: "#4F23D6"
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        alert(response.error.description || 'Payment failed');
        setIsToppingUp(false);
      });
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert("Payment initiation failed. Please try again.");
      setIsToppingUp(false);
    }
  };

  const quickPacks = ['500', '1000', '2500', '5000', '10000'];

  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter === 'CREDIT') return tx.type === 'TOPUP' || tx.type === 'REFUND' || Number(tx.amount) > 0;
    if (txFilter === 'DEBIT') return tx.type === 'AD_SPEND' || Number(tx.amount) < 0;
    return true;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#4F23D6] mb-1">
            <WalletIcon className="w-4 h-4" />
            <span>Financial & Billing Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-gray-900">
            Ad Wallet & <span className="text-[#4F23D6]">Billing</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Manage your prepaid advertising balance and review auction billing ledger.
          </p>
        </div>

        <button
          onClick={fetchWalletData}
          className="px-4 py-2 bg-white border-2 border-gray-900 text-gray-900 font-bold uppercase text-xs tracking-wider flex items-center space-x-2 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_#110C24]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Balance</span>
        </button>
      </div>

      {/* Main Top Section: Balance Card & Quick Recharge Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Balance Card */}
        <div className="lg:col-span-5 bg-[#110C24] text-white border-2 border-gray-900 p-6 sm:p-8 shadow-[6px_6px_0px_0px_#E1FF00] flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-[#E1FF00] text-black px-2 py-0.5 font-black uppercase tracking-wider">
                Prepaid Balance
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active for Bidding</span>
              </span>
            </div>

            <div className="pt-4">
              <span className="text-xs uppercase font-bold text-purple-200 block">Available Ad Credits</span>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight mt-1">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 space-y-2 text-xs text-purple-200">
            <div className="flex items-center justify-between font-bold">
              <span>Billing Model:</span>
              <span className="text-white">Cost-Per-Click (CPC)</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span>Auction Rule:</span>
              <span className="text-white">Second-Price RTB</span>
            </div>
            <p className="text-[11px] text-gray-400 pt-1 border-t border-white/10 leading-relaxed">
              Credits are deducted only when an active shopper clicks your sponsored product.
            </p>
          </div>
        </div>

        {/* Right: Instant Recharge Form */}
        <div className="lg:col-span-7 bg-white border-2 border-gray-900 p-6 sm:p-8 shadow-[6px_6px_0px_0px_#110C24] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-gray-900">
                Instant Wallet Top-Up
              </h3>
              <p className="text-xs text-gray-500 font-medium">Recharge using UPI, NetBanking, Debit/Credit Cards</p>
            </div>
            <CreditCard className="w-6 h-6 text-[#4F23D6]" />
          </div>

          <form onSubmit={handleTopUp} className="space-y-6">
            {/* Quick pack chips */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Quick Select Amount
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {quickPacks.map((pack) => (
                  <button
                    type="button"
                    key={pack}
                    onClick={() => setTopUpAmount(pack)}
                    className={`py-2 px-3 text-center border-2 text-xs font-black transition-all ${
                      topUpAmount === pack
                        ? 'border-[#4F23D6] bg-purple-50 text-[#4F23D6] shadow-[2px_2px_0px_0px_#4F23D6]'
                        : 'border-gray-200 hover:border-gray-900 text-gray-700'
                    }`}
                  >
                    ₹{pack}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Or Custom Recharge Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-xl">₹</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 border-2 border-gray-900 text-xl font-black text-gray-900 focus:outline-none focus:border-[#4F23D6]"
                  placeholder="1000"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Minimum recharge is ₹100. Tax invoices with GSTIN generated immediately.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isToppingUp || !topUpAmount}
              className="w-full py-3.5 px-6 bg-[#4F23D6] hover:bg-[#3815a8] text-white font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_#E1FF00] hover:shadow-[6px_6px_0px_0px_#E1FF00] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-[#E1FF00]" />
              <span>{isToppingUp ? 'Processing Payment...' : `Add ₹${topUpAmount || 0} to Ad Wallet`}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white border-2 border-gray-900 shadow-[6px_6px_0px_0px_#110C24] overflow-hidden">
        {/* Ledger Header */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-[#4F23D6]" />
            <h3 className="text-base font-black uppercase tracking-tight text-gray-900">
              Billing Ledger & Transaction History
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {(['ALL', 'CREDIT', 'DEBIT'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTxFilter(tab)}
                className={`px-3 py-1 text-xs font-black uppercase tracking-wider border-2 transition-all ${
                  txFilter === tab
                    ? 'border-gray-900 bg-[#4F23D6] text-white shadow-[2px_2px_0px_0px_#E1FF00]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-[#4F23D6] animate-pulse">
            Loading billing transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-bold">
            No transactions found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 text-[10px] font-black uppercase text-gray-500 tracking-wider bg-gray-50">
                  <th className="p-4">Transaction Type</th>
                  <th className="p-4">Reference / Description</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-800">
                {filteredTransactions.map((tx: any, idx: number) => {
                  const isCredit = tx.type === 'TOPUP' || tx.type === 'REFUND' || Number(tx.amount) > 0;
                  const amt = Math.abs(Number(tx.amount || 0));

                  return (
                    <tr key={tx.id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-[10px] font-black uppercase border ${
                          isCredit
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                            : 'bg-purple-50 text-[#4F23D6] border-purple-300'
                        }`}>
                          {isCredit ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          <span>{tx.type || (isCredit ? 'CREDIT' : 'AD_SPEND')}</span>
                        </span>
                      </td>

                      <td className="p-4 text-gray-900 font-medium">
                        {tx.description || (isCredit ? 'Razorpay Wallet Recharge' : 'Auction Click Deduction')}
                      </td>

                      <td className="p-4 text-gray-500 font-medium">
                        {new Date(tx.created_at || tx.createdAt || Date.now()).toLocaleString('en-IN')}
                      </td>

                      <td className={`p-4 text-right font-mono text-sm font-black ${
                        isCredit ? 'text-emerald-600' : 'text-gray-900'
                      }`}>
                        {isCredit ? '+' : '-'}₹{amt.toFixed(2)}
                      </td>

                      <td className="p-4 text-right">
                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-500 px-2 py-0.5">
                          {tx.status || 'COMPLETED'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
