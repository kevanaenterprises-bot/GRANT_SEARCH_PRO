import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Nav from '@/components/Nav';
import GrantCard, { type Grant } from '@/components/GrantCard';
import { useAuth } from '@/hooks/useAuth';
import { Flame, Thermometer, CheckCircle2, XCircle, Clock, FileText, Loader2, Search, Building2, ArrowRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

type Status = 'saved' | 'applying' | 'submitted' | 'awarded' | 'declined';

const STATUS_TABS: { value: Status | 'all'; label: string; icon: any; color: string }[] = [
  { value: 'all', label: 'All', icon: FileText, color: 'text-slate-600' },
  { value: 'saved', label: 'Saved', icon: Clock, color: 'text-blue-600' },
  { value: 'applying', label: 'Applying', icon: FileText, color: 'text-amber-600' },
  { value: 'submitted', label: 'Submitted', icon: CheckCircle2, color: 'text-green-600' },
  { value: 'awarded', label: 'Awarded', icon: Trophy, color: 'text-yellow-500' },
  { value: 'declined', label: 'Declined', icon: XCircle, color: 'text-slate-400' },
];

interface SavedGrant extends Grant {
  id: number;
  status: Status;
  notes?: string;
  profileId?: number;
}

function WelcomeScreen({ userName }: { userName: string }) {
  const [, navigate] = useLocation();
  const steps = [
    {
      number: '1',
      icon: Building2,
      title: 'Set Up Your Business Profile',
      description: 'Tell us about your business so we can match you with the right grants — industry, location, size, and goals.',
      action: 'Set Up Profile',
      href: '/profile',
      color: 'blue',
    },
    {
      number: '2',
      icon: Search,
      title: 'Search for Matching Grants',
      description: 'Our AI scans thousands of federal, state, and private grants and scores each one on how well it fits your business.',
      action: 'Find Grants',
      href: '/search',
      color: 'emerald',
    },
    {
      number: '3',
      icon: FileText,
      title: 'Generate Your Application',
      description: 'Save grants you like, then let AI draft your application in minutes using your business profile.',
      action: 'View Tracker',
      href: '/',
      color: 'purple',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {userName.split(' ')[0]}!</h1>
        <p className="text-slate-500 mt-2 text-base">
          You're 3 steps away from finding grants for your business.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const colors = {
            blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-700', btn: 'bg-blue-700 hover:bg-blue-800', num: 'text-blue-700' },
            emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', num: 'text-emerald-600' },
            purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-700', btn: 'bg-purple-700 hover:bg-purple-800', num: 'text-purple-700' },
          }[step.color as 'blue' | 'emerald' | 'purple'];

          return (
            <div key={i} className={cn('rounded-2xl border p-6 flex items-start gap-5', colors.bg, colors.border)}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white', colors.icon)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-xs font-bold uppercase tracking-wide', colors.num)}>Step {step.number}</span>
                </div>
                <h3 className="font-semibold text-slate-900 text-base">{step.title}</h3>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">{step.description}</p>
              </div>
              <button
                onClick={() => navigate(step.href)}
                className={cn('flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-sm font-medium flex-shrink-0 transition-colors', colors.btn)}
              >
                {step.action} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        Start with Step 1 — setting up your profile takes about 2 minutes.
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [grants, setGrants] = useState<SavedGrant[]>([]);
  const [tab, setTab] = useState<Status | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [generatingDraft, setGeneratingDraft] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const load = async () => {
    const res = await fetch('/api/grants');
    if (res.ok) setGrants(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: Status) => {
    await fetch(`/api/grants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const deleteGrant = async (id: number) => {
    if (!confirm('Remove this grant from your tracker?')) return;
    const res = await fetch(`/api/grants/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const generateDraft = async (grant: SavedGrant) => {
    if (!grant.profileId) { toast({ title: 'No profile linked to this grant', variant: 'destructive' }); return; }
    setGeneratingDraft(grant.id);
    try {
      const res = await fetch('/api/drafts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId: grant.id, profileId: grant.profileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Draft generated!', description: 'Opening editor...' });
      navigate(`/drafts/${data.id}`);
    } catch (err: any) {
      toast({ title: 'Draft generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingDraft(null);
    }
  };

  const filtered = tab === 'all' ? grants : grants.filter(g => g.status === tab);
  const stats = {
    hot: grants.filter(g => g.matchScore != null && g.matchScore >= 80).length,
    warm: grants.filter(g => g.matchScore != null && g.matchScore >= 50 && g.matchScore < 80).length,
    awarded: grants.filter(g => g.status === 'awarded').length,
  };

  if (loading) {
    return (
      <div>
        <Nav />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  // New user — show onboarding
  if (grants.length === 0) {
    return (
      <div>
        <Nav />
        <WelcomeScreen userName={user?.name || 'there'} />
      </div>
    );
  }

  // Returning user with grants — show tracker
  return (
    <div>
      <Nav />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Grant Tracker</h1>
            <p className="text-slate-500 text-sm">Track and manage your grant applications</p>
          </div>
          <button onClick={() => navigate('/search')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">
            <Search className="w-4 h-4" /> Find More Grants
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-red-100 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-red-500 mb-1">
              <Flame className="w-4 h-4" /><span className="text-2xl font-bold">{stats.hot}</span>
            </div>
            <p className="text-xs text-slate-500">Hot Matches</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-1">
              <Thermometer className="w-4 h-4" /><span className="text-2xl font-bold">{stats.warm}</span>
            </div>
            <p className="text-xs text-slate-500">Warm Matches</p>
          </div>
          <div className="bg-white rounded-xl border border-yellow-100 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-yellow-500 mb-1">
              <Trophy className="w-4 h-4" /><span className="text-2xl font-bold">{stats.awarded}</span>
            </div>
            <p className="text-xs text-slate-500">Awarded</p>
          </div>
        </div>

        <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit overflow-x-auto">
          {STATUS_TABS.map(({ value, label, icon: Icon, color }) => (
            <button key={value} onClick={() => setTab(value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                tab === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}>
              <Icon className={cn('w-3.5 h-3.5', tab === value ? color : '')} />
              {label}
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full', tab === value ? 'bg-slate-100' : 'bg-slate-200')}>
                {value === 'all' ? grants.length : grants.filter(g => g.status === value).length}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No grants in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(grant => (
              <div key={grant.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <GrantCard grant={grant} showSaveButton={false} />
                <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50">
                  <select
                    className="text-xs px-2 py-1.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={grant.status}
                    onChange={e => updateStatus(grant.id, e.target.value as Status)}
                  >
                    <option value="saved">Saved</option>
                    <option value="applying">Applying</option>
                    <option value="submitted">Submitted</option>
                    <option value="awarded">Awarded</option>
                    <option value="declined">Declined</option>
                  </select>
                  <button
                    onClick={() => generateDraft(grant)}
                    disabled={generatingDraft === grant.id}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {generatingDraft === grant.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                    Generate Draft
                  </button>
                  <button onClick={() => deleteGrant(grant.id)}
                    className="ml-auto text-xs text-slate-400 hover:text-red-500 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
