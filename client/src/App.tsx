import { Route, Switch, Redirect, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import ProfileSetup from './pages/ProfileSetup';
import DraftView from './pages/DraftView';
import DeepSearch from './pages/DeepSearch';
import Login from './pages/Login';
import Account from './pages/Account';
import { Toaster } from './components/ui/Toaster';
import { Loader2, FileText, ArrowRight } from 'lucide-react';

const PLANS = [
  { key: 'starter', label: 'Starter', price: '$29/mo', features: ['100 grant searches', '5 AI-written drafts', '2 business profiles'] },
  { key: 'pro', label: 'Pro', price: '$79/mo', features: ['500 searches', '20 drafts', '5 profiles + deep web scraping'], highlight: true },
  { key: 'business', label: 'Business', price: '$149/mo', features: ['Unlimited searches & drafts', '20 profiles'] },
];

function TrialWall() {
  const { user, refetch } = useAuth() as any;
  const [, navigate] = useLocation();
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await fetch('/api/billing/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setPromoError(data.error || 'Invalid code'); return; }
      if (refetch) await refetch();
      else window.location.reload();
    } catch {
      setPromoError('Something went wrong');
    } finally {
      setPromoLoading(false);
    }
  };

  const startTrial = async (plan: string) => {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(165deg, #2C1810 0%, #3E2723 25%, #4E342E 45%, #5D4037 65%, #3E2723 85%, #1B0F0A 100%)',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px',
    }}>
      {/* Orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, top: '-5%', left: '5%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.10) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', width: 380, height: 380, bottom: '5%', right: '5%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,82,45,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', width: 220, height: 220, top: '50%', left: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,201,128,0.07) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 860 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #C9A96E, #8B4513)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(201,169,110,0.3)',
          }}>
            <FileText style={{ width: 24, height: 24, color: '#1B0F0A' }} />
          </div>
          <h1 style={{ color: '#FAF3E8', fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Start Your Free 14-Day Trial
          </h1>
          <p style={{ color: 'rgba(250,243,232,0.50)', fontSize: 15, margin: 0 }}>
            Hi {user?.name?.split(' ')[0]} — pick a plan. You won't be charged until your trial ends.
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
          {PLANS.map(plan => (
            <div key={plan.key} style={{
              background: plan.highlight ? 'rgba(201,169,110,0.12)' : 'rgba(250,243,232,0.05)',
              border: plan.highlight ? '1px solid rgba(201,169,110,0.50)' : '1px solid rgba(201,169,110,0.15)',
              borderRadius: 20,
              padding: '28px 24px',
              display: 'flex', flexDirection: 'column',
              backdropFilter: 'blur(8px)',
              boxShadow: plan.highlight ? '0 0 0 1px rgba(201,169,110,0.20), 0 8px 32px rgba(0,0,0,0.3)' : 'none',
            }}>
              {plan.highlight && (
                <div style={{ color: '#C9A96E', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                  ★ Most Popular
                </div>
              )}
              <div style={{ color: '#FAF3E8', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{plan.label}</div>
              <div style={{ color: '#C9A96E', fontSize: 26, fontWeight: 800, marginBottom: 16 }}>{plan.price}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ color: 'rgba(250,243,232,0.65)', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#C9A96E', flexShrink: 0, marginTop: 1 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startTrial(plan.key)}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                  background: plan.highlight ? 'linear-gradient(135deg, #C9A96E, #A0522D)' : 'rgba(250,243,232,0.10)',
                  color: plan.highlight ? '#1B0F0A' : '#C9A96E',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: plan.highlight ? '0 4px 16px rgba(201,169,110,0.35)' : 'none',
                  border: plan.highlight ? 'none' : '1px solid rgba(201,169,110,0.25)',
                } as React.CSSProperties}
              >
                Start Free Trial <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ))}
        </div>

        {/* Promo code */}
        <div style={{ maxWidth: 360, margin: '0 auto 20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={promoCode}
              onChange={e => { setPromoCode(e.target.value); setPromoError(''); }}
              onKeyDown={e => e.key === 'Enter' && applyPromo()}
              placeholder="Have a promo code?"
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13,
                background: 'rgba(250,243,232,0.08)', border: '1px solid rgba(201,169,110,0.25)',
                color: '#FAF3E8', outline: 'none',
              }}
            />
            <button onClick={applyPromo} disabled={promoLoading}
              style={{
                padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: 'rgba(201,169,110,0.20)', border: '1px solid rgba(201,169,110,0.35)',
                color: '#C9A96E', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              {promoLoading ? '…' : 'Apply'}
            </button>
          </div>
          {promoError && <p style={{ color: '#F87171', fontSize: 12, margin: '6px 0 0' }}>{promoError}</p>}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(250,243,232,0.25)', fontSize: 12, margin: '0 0 6px' }}>
            14-day free trial · Card required · Cancel before trial ends and you won't be charged
          </p>
          <button onClick={() => navigate('/account')}
            style={{ background: 'none', border: 'none', color: 'rgba(250,243,232,0.30)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
            Manage account
          </button>
        </div>
      </div>
    </div>
  );
}

function needsTrial(user: any) {
  // Block if on free plan with no active subscription
  // Exception: promo code users have a non-free plan without a stripe sub
  return user.plan === 'free' && !user.stripeSubscriptionId;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  if (needsTrial(user)) return <TrialWall />;
  return <Component />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/search" component={() => <ProtectedRoute component={Search} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={ProfileSetup} />} />
        <Route path="/drafts/:id" component={() => <ProtectedRoute component={DraftView} />} />
        <Route path="/deep-search" component={() => <ProtectedRoute component={DeepSearch} />} />
        <Route path="/account" component={() => <ProtectedRoute component={Account} />} />
      </Switch>
      <Toaster />
    </div>
  );
}
