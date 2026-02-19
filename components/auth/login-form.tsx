'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import { Loader2, Lock, Mail } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await login(formData);

      if (result.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-slate-900/40 border border-white/10 p-8 rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden group">
      {/* Decorative gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 pointer-events-none" />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-6 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          {error}
        </div>
      )}

      <div className="space-y-6 relative z-10">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-xs font-bold text-cyan-500/80 uppercase tracking-wider ml-1">
            Email Address
          </label>
          <div className="relative group/input">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
              <Mail className="h-5 w-5" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 sm:text-sm hover:border-slate-600/50"
              placeholder="atha@example.com"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-xs font-bold text-cyan-500/80 uppercase tracking-wider ml-1">
            Password
          </label>
          <div className="relative group/input">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
              <Lock className="h-5 w-5" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 sm:text-sm hover:border-slate-600/50"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <button
          type="submit"
          disabled={loading}
          className="group/btn relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold uppercase tracking-widest rounded-lg text-white overflow-hidden bg-slate-900 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyan-500 to-blue-600 opacity-80 group-hover/btn:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 w-full h-full bg-[size:200%_auto] animate-shine bg-[linear-gradient(110deg,transparent,45%,rgba(255,255,255,0.3),55%,transparent)] bg-[length:250%_100%]" />

          <span className="relative flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                SIGNING IN...
              </>
            ) : (
              'SIGN IN'
            )}
          </span>
        </button>
      </div>
    </form>
  );

}
