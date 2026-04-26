import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Nav from '@/components/Nav';
import GrantCard, { type Grant } from '@/components/GrantCard';
import { Flame, Thermometer, Snowflake, BookOpen, CheckCircle2, XCircle, Clock, Plus, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

type Status = 'saved' | 'applying' | 'submitted' | 'awarded' | 'declined';

const STATUS_TABS: { value: Status | 'all'; label: string; icon: any; color: string }[] = [
  { value: 'all', label: 'All', icon: BookOpen, color: 'text-slate-600' },
  { value: 'saved', label: 'Saved', icon: Clock, color: 'text-blue-600' },
  { value: 'applying', label: 'Applying', icon: FileText, color: 'text-amber-600' },
  { value: 'submitted', label: 'Submitted', icon: CheckCircle2, color: 'text-green-600' },
  { value: 'awarded', label: 'Awarded', icon: Flame, color: 'text-red-500' },
  { value: 'declined', label: 'Declined', icon: XCircle, color: 'text-slate-400' },
];

interface SavedGrant extends Grant {
  id: number;
  status: Status;
  notes?: string;
  profileId?: number;
}

export default function Dashboard() {
  const [grants, setGrants] = useState<SavedGrant[]>([]);
  const [tab, setTab] = useState<Status | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [generatingDraft, setGeneratingDraft] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const load = async () => {
    const res = await fetch('/api/grants');
    if (res.ok) setGrants(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: Status) => {
    const res = await fetch(`/api/grants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
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
            <Plus className="w-4 h-4" /> Find Grants
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-red-100 p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
              <Flame className="w-4 h-4" /><span className="text-2xl font-bold">{stats.hot}</span>
            </div>
            <p className="text-xs text-slate-500">Hot Matches</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
              <Thermometer className="w-4 h-4" /><span className="text-2xl font-bold">{stats.warm}</span>
            </div>
            <p className="text-xs text-slate-500">Warm Matches</p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
              <CheckCircle2 className="w-4 h-4" /><span className="text-2xl font-bold">{stats.awarded}</span>
            </div>
            <p className="text-xs text-slate-500">Awarded</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
          {STATUS_TABS.map(({ value, label, icon: Icon, color }) => (
            <button key={value} onClick={() => setTab(value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
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

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No grants here yet</p>
            <p className="text-sm mt-1">
              {tab === 'all' ? <button onClick={() => navigate('/search')} className="text-blue-600 underline">Search for grants</button> : 'Change status on saved grants to populate this tab'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(grant => (
              <div key={grant.id} className="relative">
                <GrantCard grant={grant} showSaveButton={false} />
                <div className="flex items-center gap-2 mt-2 px-1">
                  <select
                    className="text-xs px-2 py-1 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
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
