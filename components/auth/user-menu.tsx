'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
}

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed }: UserMenuProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/auth/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLogoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={cn(
        "border-t border-slate-700/50 p-4",
        collapsed ? "p-2" : "p-4"
      )}>
        <div className={cn(
          'flex items-center gap-3 rounded-lg p-2',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse flex-shrink-0" />
          {!collapsed && (
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700 rounded animate-pulse w-24" />
              <div className="h-3 bg-slate-700 rounded animate-pulse w-16" />
            </div>
          )}
        </div>
      </div>
    );
  }



  return (
    <div className={cn(
      "border-t border-slate-700/50",
      collapsed ? "p-2" : "p-4"
    )}>
      {!collapsed ? (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center gap-3 rounded-lg hover:bg-slate-800 transition-all p-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm text-white font-medium text-xs">
              <img
                src={user?.avatarUrl || "https://img.freepik.com/premium-vector/man-avatar-profile-picture-isolated-background-avatar-profile-picture-man_1293239-4868.jpg"}
                alt={user?.name || "User"}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-100 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.toLowerCase() || 'Member'}</p>
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="w-full flex items-center justify-center rounded-lg hover:bg-slate-800 transition-all p-2 text-slate-400 hover:text-slate-200"
          title={`Logout (${user?.name})`}
        >
          <LogOut className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
