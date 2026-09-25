'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#110C24] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Graphic Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#4F23D6]/20 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#4F23D6]/30 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E1FF00]/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-md w-full space-y-8 bg-black/40 p-10 backdrop-blur-xl border border-white/10 relative z-10">
        <div>
          <h2 className="text-center text-4xl font-black tracking-tighter text-white uppercase drop-shadow-2xl">
            GoldGini <br />
            <span className="text-[#E1FF00] drop-shadow-[0_0_15px_rgba(225,255,0,0.4)]">Ad Manager</span>
          </h2>
          <p className="mt-4 text-center text-sm text-purple-200 font-medium tracking-wide uppercase">
            Sign in to manage your sponsored products
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                name="email"
                type="email"
                required
                className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1FF00] focus:ring-1 focus:ring-[#E1FF00] transition-colors"
                placeholder="seller@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input
                name="password"
                type="password"
                required
                className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1FF00] focus:ring-1 focus:ring-[#E1FF00] transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 p-3">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-4 px-4 font-bold text-[#110C24] bg-[#E1FF00] hover:bg-[#cbe600] transition-all uppercase tracking-wide shadow-[4px_4px_0px_0px_#4F23D6] hover:shadow-[6px_6px_0px_0px_#4F23D6] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#4F23D6] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-[#E1FF00] hover:underline uppercase tracking-wide">
              Register Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
