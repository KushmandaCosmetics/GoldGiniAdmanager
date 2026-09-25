'use client';

import { useState, useEffect } from 'react';
import { CreditCard, History, Plus, ArrowUpRight, ArrowDownRight, Wallet as WalletIcon } from 'lucide-react';
import Script from 'next/script';

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
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
    if (!topUpAmount || isNaN(Number(topUpAmount)) || Number(topUpAmount) < 100) {
      alert("Minimum top-up amount is ₹100");
      return;
    }
    
    setIsToppingUp(true);
    
    try {
      // 1. Load Razorpay script
      const res = await initializeRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setIsToppingUp(false);
        return;
      }

      // 2. Create order on backend
      const orderRes = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(topUpAmount) })
      });
      
      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert(orderData.error || "Failed to create order");
        setIsToppingUp(false);
        return;
      }

      // 3. Initialize Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "GoldGini Ads",
        description: "Ad Manager Wallet Top-Up",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // 4. Verify payment on backend
            const verifyRes = await fetch('/api/wallet/topup', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: Number(topUpAmount) // send amount for display/logging
              })
            });
            
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setTopUpAmount('');
              fetchWalletData(); // Refresh balance and transactions
            } else {
              alert("Payment verification failed: " + verifyData.error);
            }
          } catch (err) {
            console.error(err);
            alert("Error verifying payment");
          } finally {
            setIsToppingUp(false);
          }
        },
        prefill: {
          name: "GoldGini Seller", // You could fetch the actual seller name and email here
          email: "seller@goldgini.com",
        },
        theme: {
          color: "#4F23D6"
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        alert(`Payment Failed! Reason: ${response.error.description}`);
        setIsToppingUp(false);
      });
      
      paymentObject.open();

    } catch (err) {
      console.error(err);
      setIsToppingUp(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 5000];

  if (loading) return <div className="p-8 text-[#4F23D6] font-bold">Loading Wallet...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Wallet <span className="text-[#4F23D6]">& Billing</span></h1>
          <p className="text-gray-500 mt-2 font-medium">Manage your advertising budget securely via Razorpay</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Balance Card */}
        <div className="xl:col-span-1 bg-gradient-to-br from-[#4F23D6] to-[#2c1280] p-8 relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] min-w-0">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <CreditCard className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-purple-200 font-bold uppercase tracking-wider text-sm mb-2">Available Balance</p>
            <h2 className="text-5xl font-black text-white tracking-tighter">
              ₹{balance.toFixed(2)}
            </h2>

            {/* Low balance warning */}
            {balance < 100 && (
              <div className="mt-4 bg-red-500/20 border border-red-400/30 px-3 py-2 rounded">
                <p className="text-red-200 text-xs font-bold uppercase">⚠ Low Balance — Campaigns may pause</p>
              </div>
            )}
            
            <form onSubmit={handleTopUp} className="mt-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-200 uppercase tracking-wider mb-2">Add Funds (₹)</label>
                <div className="flex">
                  <input
                    type="number"
                    min="100"
                    step="1"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="flex-1 min-w-0 bg-white/10 border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-[#E1FF00] font-mono placeholder-white/30"
                    placeholder="Min. 100"
                  />
                  <button
                    type="submit"
                    disabled={isToppingUp}
                    className="bg-white text-[#4F23D6] px-4 font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors flex items-center disabled:opacity-50"
                  >
                    {isToppingUp ? 'Wait...' : <><Plus className="w-5 h-5 mr-1" /> Add</>}
                  </button>
                </div>
              </div>
              {/* Quick amount buttons */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt.toString())}
                    className="flex-1 bg-white/10 border border-white/20 text-white/80 py-2 text-sm font-bold hover:bg-white/20 transition-colors"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* Transactions List */}
        <div className="xl:col-span-2 bg-white border border-gray-200 p-8 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <History className="text-[#4F23D6] w-6 h-6" />
              <h3 className="text-xl font-bold uppercase tracking-wide text-gray-900">Recent Transactions</h3>
            </div>
            <span className="text-sm text-gray-400 font-medium">{transactions.length} transactions</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="pb-3 font-bold">Date</th>
                  <th className="pb-3 font-bold">Type</th>
                  <th className="pb-3 font-bold">Amount</th>
                  <th className="pb-3 font-bold">Balance After</th>
                  <th className="pb-3 font-bold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <WalletIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No transactions yet</p>
                      <p className="text-gray-400 text-sm">Add funds via Razorpay to start advertising</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => {
                    const isCredit = tx.type === 'TOPUP' || tx.type === 'REFUND';
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 text-sm text-gray-600 font-mono whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                            isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {isCredit ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-4 font-black tracking-tighter whitespace-nowrap ${
                          isCredit ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isCredit ? '+' : ''}₹{Math.abs(Number(tx.amount)).toFixed(2)}
                        </td>
                        <td className="py-4 text-sm text-gray-600 font-mono whitespace-nowrap">
                          ₹{Number(tx.balanceAfter).toFixed(2)}
                        </td>
                        <td className="py-4 text-sm text-gray-500 font-medium max-w-[200px] truncate" title={tx.description}>{tx.description}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
