import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,1),_rgba(2,6,23,1))]" />
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]" />

      {/* Animated Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse-glow" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl mix-blend-screen animate-pulse-glow" style={{ animationDuration: '7s' }} />

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative h-16 w-16 rounded-xl flex items-center justify-center bg-slate-900 ring-1 ring-white/10 mb-6">
              <Briefcase className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            REBINMAS
          </h1>
          <p className="text-cyan-500/60 uppercase tracking-[0.2em] text-sm font-semibold mb-8">
            Project Management System
          </p>
        </div>

        <LoginForm />

        <p className="mt-8 text-center text-sm text-slate-500">
          Need access?{' '}
          <Link
            href="/auth/register"
            className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors hover:underline hover:underline-offset-4"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
