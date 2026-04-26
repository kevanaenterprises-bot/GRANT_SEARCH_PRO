import { useState } from 'react';
import { useLocation } from 'wouter';
import Nav from '@/components/Nav';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ShieldCheck, CreditCard, LogOut, Key, Check, Loader2, ExternalLink, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    key: 'starter', label: 'Starter', price: '$29/mo',
    features: ['100 grant searches/month', 'AI match scoring', '5 application drafts/month', '2 business profiles', 'Email digest', 'SAM.gov checks'],
    color: 'border-blue-200 bg-blue-50',
    cta: 'bg-blue-700 hover:bg-blue-800',
  },
  {
    key: 'pro', label: 'Pro', price: '$79/mo',
    features: ['500 searches/month', '20 drafts/month', '5 business profiles', 'Deep web scraping', 'SAM contract search', 'PDF export', 'Priority support'],
    color: 'border-purple-200 bg-purple-50',
    cta: 'bg-purple-700 hover:bg-purple-800',
    badge: 'Most Popular',
  },
  {
    key: 'business', label: 'Business', price: '$149/mo',
    features: ['Unlimited searches', 'Unlimited drafts', '20 business profiles', 'Everything in Pro', 'Multi-LLC management', 'API access'],
    color: 'border-amber-200 bg-amber-50',
    cta: 'bg-amber-600 hover:bg-amber-700',
  },
  {
    key: 'agency', label: 'Agency', price: '$299/mo',
    features: ['Everything in Business', 'Unlimited client profiles', 'White-label PDF exports', 'Team seat management', 'Dedicated onboarding', 'SLA support'],
    color: 'border-rose-200 bg-rose-50',
    cta: 'bg-rose-700 hover:bg-rose-800',
    badge: 'For Consultants',
  },
];

export default function Account() {
  const { user, logout, refresh } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [samKey, setSamKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const saveSamKey = async () => {
    setSavingKey(true);
    try {
      const res = await fetch('/api/auth/sam-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ samApiKey: samKey }),
      });
      if (!res.ok) throw new Error('Failed to save key');
      await refresh();
      setSamKey('');
      toast({ title: 'SAM.gov API key saved!', description: 'Encrypted and stored securely.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingKey(false);
    }
  };

  const startCheckout = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: 'Checkout failed', description: err.message, variant: 'destructive' });
      setCheckoutLoading(null);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setPortalLoading(false);
    }
  };

  return (
    <div>
      <Nav />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Account</h1>

        {/* Profile card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{user?.name}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <span className={cn(
              'text-xs font-semibold px-2.5 py-1 rounded-full',
              user?.plan === 'free' ? 'bg-slate-100 text-slate-600' :
              user?.plan === 'starter' ? 'bg-blue-100 text-blue-700' :
              user?.plan === 'pro' ? 'bg-purple-100 text-purple-700' :
              'bg-amber-100 text-amber-700'
            )}>
              {user?.plan?.toUpperCase() || 'FREE'} PLAN
            </span>
            {user?.plan !== 'free' && user?.stripeCurrentPeriodEnd && (
              <span className="text-xs text-slate-500">
                Renews {new Date(user.stripeCurrentPeriodEnd * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {user?.plan !== 'free' && (
              <button onClick={openPortal} disabled={portalLoading}
                className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors">
                {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                Manage Billing
              </button>
            )}
          </div>
        </div>

        {/* SAM.gov API Key */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-5">
          <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> SAM.gov API Key
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Required for live SAM.gov registration checks and contract opportunities.{' '}
            <a href="https://sam.gov/content/entity-registration" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
              Get a free key at SAM.gov <ExternalLink className="w-3 h-3" />
            </a>
          </p>

          {user?.hasSamKey ? (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm flex-1">
                <Check className="w-4 h-4" /> API key saved and encrypted
              </div>
              <button onClick={() => setSamKey(' ')}
                className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                Replace
              </button>
            </div>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              No key saved — SAM.gov features are limited until you add one
            </p>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste your SAM.gov API key here"
                value={samKey}
                onChange={e => setSamKey(e.target.value)}
              />
            </div>
            <button onClick={saveSamKey} disabled={!samKey.trim() || savingKey}
              className="px-4 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2">
              {savingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {/* Upgrade plans */}
        {user?.plan === 'free' && (
          <div>
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Upgrade Your Plan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PLANS.map(plan => (
                <div key={plan.key} className={cn('rounded-xl border p-4 relative', plan.color)}>
                  {plan.badge && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-700 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                      {plan.badge}
                    </div>
                  )}
                  <div className="font-bold text-slate-900 mb-0.5">{plan.label}</div>
                  <div className="text-lg font-bold text-slate-800 mb-3">{plan.price}</div>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map(f => (
                      <li key={f} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => startCheckout(plan.key)} disabled={checkoutLoading === plan.key}
                    className={cn('w-full py-2 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2', plan.cta, 'disabled:opacity-50')}>
                    {checkoutLoading === plan.key ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {checkoutLoading === plan.key ? 'Loading...' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {user?.plan !== 'free' && (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">
              Need to change or cancel your plan?{' '}
              <button onClick={openPortal} className="text-blue-600 hover:underline">Open billing portal</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
