import { useState, useEffect } from 'react';
import Nav from '@/components/Nav';
import GrantCard, { type Grant } from '@/components/GrantCard';
import { Search as SearchIcon, Loader2, Sparkles, Filter } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const STATUS_OPTIONS = [
  { value: 'posted', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

interface Profile { id: number; name: string; naicsCodes: string; state: string; }

export default function Search() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('posted');
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [total, setTotal] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/profiles').then(r => r.json()).then((data: Profile[]) => {
      setProfiles(data);
      if (data.length) setActiveProfileId(data[0].id);
    });
  }, []);

  const search = async () => {
    setLoading(true);
    setGrants([]);
    try {
      const res = await fetch('/api/grants/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword || undefined, oppStatuses: status, rows: 20 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGrants(data.grants);
      setTotal(data.total);
    } catch (err: any) {
      toast({ title: 'Search failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const scoreAll = async () => {
    if (!activeProfileId) { toast({ title: 'Select a business profile first', variant: 'destructive' }); return; }
    if (!grants.length) return;
    setScoring(true);
    try {
      const res = await fetch('/api/score/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grants, profileId: activeProfileId }),
      });
      const scores = await res.json();
      if (!res.ok) throw new Error(scores.error);
      const scored = grants.map((g, i) => ({
        ...g,
        matchScore: scores[i]?.score,
        tier: scores[i]?.tier,
        scoreSummary: scores[i]?.summary,
      }));
      // Sort: hot first, then warm, then cold
      scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setGrants(scored);
      toast({ title: `Scored ${scored.length} grants`, description: 'Sorted by best match' });
    } catch (err: any) {
      toast({ title: 'Scoring failed', description: err.message, variant: 'destructive' });
    } finally {
      setScoring(false);
    }
  };

  return (
    <div>
      <Nav />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Find Grants</h1>
          <p className="text-slate-500 text-sm">Search Grants.gov and score results against your business profile</p>
        </div>

        {/* Search bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search keywords (e.g. transportation, small business, technology)"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
              />
            </div>
            <select
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={search}
              disabled={loading}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
              Search
            </button>
          </div>

          {/* Profile + score bar */}
          {profiles.length > 0 && (
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">Score for:</span>
              <select
                className="text-xs px-2 py-1 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={activeProfileId || ''}
                onChange={e => setActiveProfileId(Number(e.target.value))}
              >
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {grants.length > 0 && (
                <button
                  onClick={scoreAll}
                  disabled={scoring}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-50"
                >
                  {scoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {scoring ? 'Scoring...' : `Score All ${grants.length}`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {total > 0 && (
          <p className="text-xs text-slate-500 mb-3">{total.toLocaleString()} total results — showing top {grants.length}</p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {grants.map(g => (
            <GrantCard
              key={g.opportunityId}
              grant={g}
              profileId={activeProfileId || undefined}
              showSaveButton={!!activeProfileId}
            />
          ))}
        </div>

        {!loading && grants.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Search Grants.gov above</p>
            <p className="text-sm mt-1">Try keywords like "transportation", "trucking", or "small business"</p>
          </div>
        )}
      </div>
    </div>
  );
}
