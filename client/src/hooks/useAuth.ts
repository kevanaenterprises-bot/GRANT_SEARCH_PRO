import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: number;
  email: string;
  name: string;
  plan: string;
  hasSamKey: boolean;
  stripeCurrentPeriodEnd?: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Module-level state so any component can call useAuth() without re-fetching
let _user: User | null = null;
let _loading = true;
const listeners = new Set<() => void>();

function notify() { listeners.forEach(l => l()); }

async function fetchMe(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch { return null; }
}

// Boot: check session on page load
fetchMe().then(user => {
  _user = user;
  _loading = false;
  notify();
});

export function useAuth(): AuthState {
  const [, rerender] = useState(0);
  useEffect(() => {
    const cb = () => rerender(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  return {
    user: _user,
    loading: _loading,

    async login(email, password) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      _user = data.user;
      notify();
    },

    async register(email, password, name) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      _user = data.user;
      notify();
    },

    async logout() {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      _user = null;
      notify();
    },

    async refresh() {
      _user = await fetchMe();
      notify();
    },
  };
}
