'use client';

import { useState } from 'react';
import { X, CreditCard, ShieldCheck, Zap, Sparkles } from 'lucide-react';

interface QuickTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickTopUpModal({ isOpen, onClose, onSuccess }: QuickTopUpModalProps) {
  const [amount, setAmount] = useState<string>('1000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const quickPacks = [
    { label: 'Starter', amount: '500', popular: false },
    { label: 'Growth', amount: '1000', popular: true },
    { label: 'Pro Scale', amount: '2500', popular: false },
    { label: 'Enterprise', amount: '5000', popular: false },
  ];

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
    const num = Number(amount);
    if (!amount || isNaN(num) || num < 100) {
      setError('Minimum top-up amount is ₹100');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isLoaded = await initializeRazorpay();
      if (!isLoaded) {
        setError('Payment gateway SDK failed to load. Please check your internet connection.');
        setLoading(false);
        return;
      }

      const orderRes = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: num }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        setError(orderData.error || 'Failed to initiate wallet order');
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'GoldGini Ad Manager',
        description: `Ad Credits Top-Up (₹${num})`,
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
                amount: num,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              if (onSuccess) onSuccess();
              onClose();
            } else {
              setError(verifyData.error || 'Payment verification failed');
            }
          } catch (err) {
            setError('Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        theme: {
          color: '#4F23D6',
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', function (response: any) {
        setError(response.error?.description || 'Payment failed');
        setLoading(false);
      });
      razorpayInstance.open();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-gray-900 w-full max-w-lg shadow-[8px_8px_0px_0px_#110C24] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#110C24] text-white p-6 flex justify-between items-center border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-[#E1FF00]" />
              <h2 className="text-xl font-black uppercase tracking-tight">Quick Wallet Recharge</h2>
            </div>
            <p className="text-xs text-purple-200 mt-1">Instant ad balance for active bidding & campaigns</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleTopUp} className="p-6 space-y-6">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Select Amount Package
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickPacks.map((pack) => (
                <button
                  type="button"
                  key={pack.amount}
                  onClick={() => setAmount(pack.amount)}
                  className={`p-3 text-center border-2 transition-all relative ${
                    amount === pack.amount
                      ? 'border-[#4F23D6] bg-purple-50 text-[#4F23D6] font-black shadow-[3px_3px_0px_0px_#4F23D6]'
                      : 'border-gray-200 hover:border-gray-900 text-gray-700 font-bold'
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#E1FF00] text-black text-[9px] px-1.5 py-0.5 font-black uppercase tracking-tighter border border-black">
                      Popular
                    </span>
                  )}
                  <div className="text-xs text-gray-500 uppercase">{pack.label}</div>
                  <div className="text-lg">₹{pack.amount}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Or Enter Custom Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-lg">₹</span>
              <input
                type="number"
                min="100"
                step="50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full pl-9 pr-4 py-3 border-2 border-gray-900 text-xl font-black text-gray-900 focus:outline-none focus:border-[#4F23D6] focus:ring-2 focus:ring-[#4F23D6]/20 transition-all"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">Minimum recharge is ₹100. GST invoices generated automatically.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Value props */}
          <div className="bg-gray-50 p-3 border border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center space-x-1 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-Bit SSL Secured</span>
            </span>
            <span className="flex items-center space-x-1 font-bold">
              <Sparkles className="w-4 h-4 text-[#4F23D6]" />
              <span>Instant Credits Activation</span>
            </span>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount}
              className="flex-2 py-3 px-6 bg-[#4F23D6] hover:bg-[#3d19b3] text-white font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#E1FF00] hover:shadow-[6px_6px_0px_0px_#E1FF00] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#E1FF00] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              <span>{loading ? 'Processing...' : `Pay ₹${amount || 0}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
