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
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

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

  const redeemPromo = async () => {
    setPromoLoading(true);
    try {
      const res = await fetch('/api/billing/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refresh();
      setPromoCode('');
      toast({ title: 'Promo code applied!', description: 'Agency plan unlocked.' });
    } catch (err: any) {
      toast({ title: 'Invalid code', description: err.message, variant: 'destructive' });
    } finally {
      setPromoLoading(false);
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

  const planColor = user?.plan === 'starter' ? '#3B82F6' : user?.plan === 'pro' ? '#9333EA' : user?.plan === 'agency' ? '#D97706' : '#64748B';

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />

      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #4E342E 100%)',
        borderBottom: '1px solid rgba(201,169,110,0.20)',
      }} className="px-6 py-8">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #C9A96E, #8B4513)',
            boxShadow: '0 4px 16px rgba(201,169,110,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#1B0F0A',
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#FAF3E8', margin: 0 }} className="text-2xl font-bold">{user?.name}</h1>
            <p style={{ color: 'rgba(250,243,232,0.55)', margin: '2px 0 0' }} className="text-sm">{user?.email}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(201,169,110,0.18)', color: '#C9A96E',
              border: '1px solid rgba(201,169,110,0.35)',
            }}>
              {user?.plan?.toUpperCase() || 'FREE'} PLAN
            </span>
            <button onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(250,243,232,0.07)', border: '1px solid rgba(250,243,232,0.15)',
                color: 'rgba(250,243,232,0.50)',
              }}>
              <LogOut style={{ width: 13, height: 13 }} /> Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Billing strip */}
        {user?.plan !== 'free' && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-5 flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-700 font-medium flex-1">
              {user?.stripeCurrentPeriodEnd
                ? `Renews ${new Date(user.stripeCurrentPeriodEnd * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : 'Active subscription'}
            </span>
            <button onClick={openPortal} disabled={portalLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors">
              {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
              Manage Billing
            </button>
          </div>
        )}

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

        {/* Promo code */}
        {user?.plan === 'free' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-5">
            <h2 className="font-semibold text-slate-800 mb-1">Have a promo code?</h2>
            <p className="text-xs text-slate-500 mb-4">Enter it below to unlock full access instantly.</p>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="GSP-XXXX-XXXX"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && promoCode.trim() && redeemPromo()}
              />
              <button
                onClick={redeemPromo}
                disabled={!promoCode.trim() || promoLoading}
                className="px-4 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
              >
                {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Upgrade plans */}
        {user?.plan === 'free' && (
          <div>
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: '#C9A96E' }} /> Upgrade Your Plan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PLANS.filter(p => ['starter','pro','business'].includes(p.key)).map(plan => {
                const isHighlight = plan.key === 'pro';
                return (
                  <div key={plan.key} style={{
                    borderRadius: 16, padding: 16, position: 'relative',
                    background: isHighlight ? 'linear-gradient(135deg, rgba(201,169,110,0.10), rgba(139,69,19,0.06))' : 'white',
                    border: isHighlight ? '1px solid rgba(201,169,110,0.45)' : '1px solid #e2e8f0',
                    boxShadow: isHighlight ? '0 0 0 1px rgba(201,169,110,0.15), 0 4px 16px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                    {plan.badge && (
                      <div style={{
                        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #C9A96E, #8B4513)',
                        color: '#1B0F0A', fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 20,
                        whiteSpace: 'nowrap',
                      }}>{plan.badge}</div>
                    )}
                    <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{plan.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: isHighlight ? '#8B4513' : '#334155', marginBottom: 12 }}>{plan.price}</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {plan.features.map(f => (
                        <li key={f} style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <span style={{ color: '#C9A96E', flexShrink: 0, marginTop: 1 }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => startCheckout(plan.key)} disabled={checkoutLoading === plan.key}
                      style={{
                        width: '100%', padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: isHighlight ? 'linear-gradient(135deg, #C9A96E, #A0522D)' : 'rgba(201,169,110,0.12)',
                        color: isHighlight ? '#1B0F0A' : '#8B4513',
                        fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        boxShadow: isHighlight ? '0 3px 12px rgba(201,169,110,0.30)' : 'none',
                        opacity: checkoutLoading === plan.key ? 0.6 : 1,
                      }}>
                      {checkoutLoading === plan.key ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {checkoutLoading === plan.key ? 'Loading...' : 'Start Free Trial'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {user?.plan !== 'free' && (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">
              Need to change or cancel your plan?{' '}
              <button onClick={openPortal} className="text-amber-700 hover:underline font-medium">Open billing portal</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
