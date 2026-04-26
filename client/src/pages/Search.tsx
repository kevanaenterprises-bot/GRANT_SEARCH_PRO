import { useState, useEffect } from 'react';
import Nav from '@/components/Nav';
import GrantCard, { type Grant } from '@/components/GrantCard';
import { Search as SearchIcon, Loader2, Sparkles, Zap, Globe } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'posted', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

interface Profile { id: number; name: string; naicsCodes: string; state: string; }

type SearchMode = 'manual' | 'smart' | 'discover';

export default function Search() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('posted');
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [total, setTotal] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [mode, setMode] = useState<SearchMode>('smart');
  const [sources, setSources] = useState<string[]>([]);
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
    setSources([]);
    try {
      if (mode === 'discover' || mode === 'smart') {
        if (!activeProfileId) {
          toast({ title: 'Select a business profile first', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const endpoint = mode === 'discover' ? '/api/grants/discover' : '/api/grants/smart-search';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: activeProfileId, oppStatuses: status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setGrants(data.grants);
        setTotal(data.total);
        setSources(data.sources || ['Grants.gov']);
      } else {
        const res = await fetch('/api/grants/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: keyword || undefined, oppStatuses: status, rows: 20 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setGrants(data.grants);
        setTotal(data.total);
        setSources(['Grants.gov']);
      }
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
      scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setGrants(scored);
      toast({ title: `Scored ${scored.length} grants`, description: 'Sorted by best match' });
    } catch (err: any) {
      toast({ title: 'Scoring failed', description: err.message, variant: 'destructive' });
    } finally {
      setScoring(false);
    }
  };

  const modeConfig = {
    smart: { icon: Zap, label: 'Smart Search', desc: 'Auto-builds keywords from your NAICS codes', color: 'bg-blue-700 hover:bg-blue-800' },
    discover: { icon: Globe, label: 'Discover All Sources', desc: 'Grants.gov + SBA programs + state portals combined', color: 'bg-purple-700 hover:bg-purple-800' },
    manual: { icon: SearchIcon, label: 'Manual Search', desc: 'Search by your own keywords', color: 'bg-slate-700 hover:bg-slate-800' },
  };

  const ModeIcon = modeConfig[mode].icon;

  return (
    <div>
      <Nav />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Find Grants</h1>
          <p className="text-slate-500 text-sm">Search Grants.gov, SBA programs, and state portals — scored for your business</p>
        </div>

        {/* Mode picker */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(Object.entries(modeConfig) as [SearchMode, typeof modeConfig[SearchMode]][]).map(([m, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button key={m} onClick={() => setMode(m)}
                className={cn(
                  'text-left p-3 rounded-xl border-2 transition-all',
                  mode === m ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                )}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn('w-4 h-4', mode === m ? 'text-blue-600' : 'text-slate-400')} />
                  <span className={cn('text-sm font-semibold', mode === m ? 'text-blue-700' : 'text-slate-700')}>{cfg.label}</span>
                </div>
                <p className="text-xs text-slate-500">{cfg.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
          <div className="flex gap-2 mb-3">
            {mode === 'manual' && (
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search keywords (e.g. transportation, small business)"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                />
              </div>
            )}
            {mode !== 'manual' && (
              <div className="flex-1 flex items-center px-3 py-2 rounded-lg border border-blue-100 bg-blue-50 text-sm text-blue-700">
                <Zap className="w-4 h-4 mr-2 shrink-0" />
                {profiles.find(p => p.id === activeProfileId)
                  ? `Searching for ${profiles.find(p => p.id === activeProfileId)?.name}`
                  : 'Select a profile below to search'}
              </div>
            )}
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
              className={cn('px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2', modeConfig[mode].color)}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ModeIcon className="w-4 h-4" />}
              {modeConfig[mode].label}
            </button>
          </div>

          {/* Profile selector + Score All */}
          {profiles.length > 0 && (
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">Profile:</span>
              <select
                className="text-xs px-2 py-1 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={activeProfileId || ''}
                onChange={e => setActiveProfileId(Number(e.target.value))}
              >
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {sources.length > 0 && (
                <div className="flex gap-1">
                  {sources.map(s => (
                    <span key={s} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}
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

        {total > 0 && (
          <p className="text-xs text-slate-500 mb-3">{total} grants found — showing all results</p>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">
              {mode === 'discover' ? 'Searching Grants.gov, SBA, and state portals...' : 'Searching Grants.gov...'}
            </p>
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
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Ready to search</p>
            <p className="text-sm mt-1">
              {mode === 'discover'
                ? 'Click "Discover All Sources" to pull from Grants.gov, SBA programs, and your state portal'
                : mode === 'smart'
                ? 'Click "Smart Search" to find grants matching your NAICS codes automatically'
                : 'Enter keywords above and click Search'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
