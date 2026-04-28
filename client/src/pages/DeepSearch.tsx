import { useState, useEffect, useRef } from 'react';
import Nav from '@/components/Nav';
import GrantCard, { type Grant } from '@/components/GrantCard';
import { Globe, Loader2, Sparkles, StopCircle, Terminal, ChevronDown, ChevronUp, Building2, FileSearch } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface Profile { id: number; name: string; naicsCodes: string; state: string; }

type Tab = 'scrape' | 'contracts';

export default function DeepSearch() {
  const [tab, setTab] = useState<Tab>('scrape');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');

  // Scrape state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<string[]>([]);
  const [results, setResults] = useState<Grant[]>([]);
  const [scored, setScored] = useState<Grant[]>([]);
  const [scoring, setScoring] = useState(false);
  const [logsOpen, setLogsOpen] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Contracts state
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/profiles').then(r => r.json()).then((data: Profile[]) => {
      setProfiles(data);
      if (data.length) setActiveProfileId(data[0].id);
    });
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startScrape = async () => {
    setResults([]);
    setScored([]);
    setProgress([]);
    setJobStatus('running');

    const res = await fetch('/api/scrape/deep-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: activeProfileId, keyword: keyword || undefined }),
    });
    const { jobId: id } = await res.json();
    setJobId(id);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/scrape/job/${id}`);
        if (!r.ok) { clearInterval(pollRef.current!); return; }
        const job = await r.json();
        setProgress(job.progress);
        setResults(job.results);
        setJobStatus(job.status);
        if (job.status === 'done' || job.status === 'cancelled') {
          clearInterval(pollRef.current!);
          pollRef.current = null;
        }
      } catch {}
    }, 1500);
  };

  const cancelScrape = async () => {
    if (!jobId) return;
    await fetch(`/api/scrape/job/${jobId}`, { method: 'DELETE' });
    if (pollRef.current) clearInterval(pollRef.current);
    setJobStatus('cancelled');
  };

  const scoreAll = async () => {
    if (!activeProfileId || !results.length) return;
    setScoring(true);
    try {
      const res = await fetch('/api/score/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grants: results, profileId: activeProfileId }),
      });
      const scores = await res.json();
      const s = results.map((g, i) => ({
        ...g,
        matchScore: scores[i]?.score,
        tier: scores[i]?.tier,
        scoreSummary: scores[i]?.summary,
      })).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setScored(s);
      toast({ title: `Scored ${s.length} grants`, description: 'Sorted by best match' });
    } catch (err: any) {
      toast({ title: 'Scoring failed', description: err.message, variant: 'destructive' });
    } finally {
      setScoring(false);
    }
  };

  const loadContracts = async () => {
    if (!activeProfileId) { toast({ title: 'Select a profile first', variant: 'destructive' }); return; }
    setContractsLoading(true);
    setContracts([]);
    try {
      const res = await fetch('/api/scrape/sam-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: activeProfileId, keyword: keyword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContracts(data.opportunities || []);
      toast({ title: `Found ${data.total} contract opportunities` });
    } catch (err: any) {
      toast({ title: 'Contracts search failed', description: err.message, variant: 'destructive' });
    } finally {
      setContractsLoading(false);
    }
  };

  const displayGrants = scored.length ? scored : results;

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />

      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #4E342E 100%)',
        borderBottom: '1px solid rgba(201,169,110,0.20)',
      }} className="px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #C9A96E, #8B4513)',
            boxShadow: '0 4px 16px rgba(201,169,110,0.35)',
          }} className="flex items-center justify-center">
            <Globe style={{ color: '#1B0F0A', width: 22, height: 22 }} />
          </div>
          <div>
            <h1 style={{ color: '#FAF3E8' }} className="text-2xl font-bold m-0">Deep Search</h1>
            <p style={{ color: 'rgba(250,243,232,0.55)' }} className="text-sm m-0 mt-0.5">
              Headless browser crawls state portals, SBA, and grant databases — plus SAM.gov set-aside contracts
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {([
            { key: 'scrape', label: 'Web Scrape', icon: Globe },
            { key: 'contracts', label: 'SAM Contracts', icon: Building2 },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              style={tab === key ? {
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #C9A96E, #8B4513)',
                color: '#1B0F0A', fontSize: 13, fontWeight: 700,
                boxShadow: '0 2px 10px rgba(160,82,45,0.30)',
              } : {
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
                background: 'white', border: '1px solid #e2e8f0',
                color: '#64748b', fontSize: 13, fontWeight: 500,
              }}>
              <Icon style={{ width: 14, height: 14 }} /> {label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 shadow-sm">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Optional keyword override (default: uses your NAICS profile)"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <select
              className="text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={activeProfileId || ''}
              onChange={e => setActiveProfileId(Number(e.target.value))}
            >
              {profiles.length === 0 && <option>No profiles — add one first</option>}
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {tab === 'scrape' && (
              <>
                {jobStatus !== 'running' ? (
                  <button onClick={startScrape}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800">
                    <Globe className="w-4 h-4" /> Start Deep Search
                  </button>
                ) : (
                  <button onClick={cancelScrape}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                    <StopCircle className="w-4 h-4" /> Cancel
                  </button>
                )}
                {results.length > 0 && jobStatus === 'done' && (
                  <button onClick={scoreAll} disabled={scoring}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                    {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {scoring ? 'Scoring...' : `Score All ${results.length}`}
                  </button>
                )}
              </>
            )}
            {tab === 'contracts' && (
              <button onClick={loadContracts} disabled={contractsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
                {contractsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                {contractsLoading ? 'Searching...' : 'Search Set-Aside Contracts'}
              </button>
            )}
          </div>
        </div>

        {/* === WEB SCRAPE TAB === */}
        {tab === 'scrape' && (
          <>
            {/* Live progress log */}
            {progress.length > 0 && (
              <div className="bg-slate-900 rounded-xl mb-5 overflow-hidden">
                <button
                  onClick={() => setLogsOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5" />
                    <span className="font-mono font-medium">Browser Log</span>
                    {jobStatus === 'running' && <Loader2 className="w-3 h-3 animate-spin text-purple-400" />}
                    {jobStatus === 'done' && <span className="text-green-400">● done</span>}
                    {jobStatus === 'cancelled' && <span className="text-red-400">● cancelled</span>}
                  </div>
                  {logsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {logsOpen && (
                  <div className="px-4 pb-4 max-h-52 overflow-y-auto">
                    {progress.map((line, i) => (
                      <div key={i} className={cn('font-mono text-xs py-0.5',
                        line.startsWith('✅') ? 'text-green-400' :
                        line.startsWith('⚠️') ? 'text-yellow-400' :
                        line.startsWith('🎉') ? 'text-purple-300 font-semibold' :
                        line.startsWith('🔍') ? 'text-blue-300' :
                        'text-slate-400'
                      )}>
                        {line}
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {displayGrants.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500">
                    {displayGrants.length} grants from web scraping
                    {scored.length > 0 && ' · sorted by AI match score'}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {displayGrants.map(g => (
                    <GrantCard key={g.opportunityId} grant={g} profileId={activeProfileId || undefined} showSaveButton={!!activeProfileId} />
                  ))}
                </div>
              </>
            )}

            {jobStatus === 'idle' && (
              <div className="text-center py-16 text-slate-400">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Start a deep search</p>
                <p className="text-sm mt-1">Launches an incognito Chrome browser to crawl state portals, SBA.gov, and GrantWatch live</p>
                <p className="text-xs mt-2 text-slate-300">Takes 30–60 seconds · No rate limits hit · Each source runs in a fresh session</p>
              </div>
            )}
          </>
        )}

        {/* === SAM CONTRACTS TAB === */}
        {tab === 'contracts' && (
          <>
            {contractsLoading && (
              <div className="flex items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500">Searching SAM.gov contract opportunities...</p>
              </div>
            )}

            {contracts.length > 0 && (
              <div className="space-y-3">
                {contracts.map(c => (
                  <div key={c.noticeId} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-1.5">
                          {c.setAside && (
                            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {c.setAside}
                            </span>
                          )}
                          {c.type && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{c.type}</span>
                          )}
                          {c.naicsCode && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">{c.naicsCode}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm leading-snug">{c.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{c.agency}</p>
                        {c.description && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{c.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {c.awardCeiling && (
                          <span className="text-xs font-semibold text-slate-700">
                            ${(c.awardCeiling / 1000).toFixed(0)}K
                          </span>
                        )}
                        {c.closeDate && (
                          <span className="text-xs text-slate-400">
                            Due {new Date(c.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <a href={c.link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1">View →</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!contractsLoading && contracts.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">SAM.gov Set-Aside Contracts</p>
                <p className="text-sm mt-1">Finds federal contracts reserved for small, minority, veteran, and HUBZone businesses</p>
                <p className="text-xs mt-2 text-slate-300">Uses your profile's NAICS codes and state to filter results</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
