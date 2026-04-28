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
  const { user } = useAuth();
  const [, navigate] = useLocation();

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center mb-4">
        <FileText className="w-5 h-5 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Start Your Free 14-Day Trial</h1>
      <p className="text-slate-500 text-sm mb-8 text-center max-w-sm">
        Hi {user?.name?.split(' ')[0]} — pick a plan to get started. You won't be charged until your trial ends. Cancel anytime.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-6">
        {PLANS.map(plan => (
          <div key={plan.key} className={`bg-white rounded-2xl border p-6 flex flex-col ${plan.highlight ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200'}`}>
            {plan.highlight && <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Most Popular</div>}
            <div className="font-bold text-slate-900 text-lg">{plan.label}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 mb-3">{plan.price}</div>
            <ul className="space-y-1.5 flex-1 mb-5">
              {plan.features.map(f => (
                <li key={f} className="text-sm text-slate-600 flex items-start gap-1.5">
                  <span className="text-blue-500 mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => startTrial(plan.key)}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${plan.highlight ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
            >
              Start Free Trial <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-slate-400">14-day free trial · Card required · Cancel before trial ends and you won't be charged</p>
        <button onClick={() => navigate('/account')} className="text-xs text-slate-400 underline hover:text-slate-600">
          Manage account
        </button>
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
