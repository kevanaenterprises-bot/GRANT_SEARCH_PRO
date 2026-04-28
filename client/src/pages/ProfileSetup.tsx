import { useState, useEffect } from 'react';
import Nav from '@/components/Nav';
import SamStatus from '@/components/SamStatus';
import { Building2, Plus, Trash2, Save, Loader2, Check, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const NAICS_SUGGESTIONS = [
  { code: '484', label: '484 — Trucking' },
  { code: '484110', label: '484110 — General Freight Trucking, Local' },
  { code: '484121', label: '484121 — General Freight Trucking, Long-Distance' },
  { code: '541511', label: '541511 — Custom Computer Programming' },
  { code: '541512', label: '541512 — Computer Systems Design' },
  { code: '541990', label: '541990 — Other Professional Services' },
  { code: '488510', label: '488510 — Freight Transportation Arrangement' },
  { code: '522390', label: '522390 — Financial Services' },
];

const OWNERSHIP_OPTIONS = [
  { value: '', label: 'Standard Small Business' },
  { value: 'minority', label: 'Minority-Owned (MBE)' },
  { value: 'woman', label: 'Woman-Owned (WBE/WOSB)' },
  { value: 'veteran', label: 'Veteran-Owned (VOSB)' },
  { value: 'service-disabled-veteran', label: 'Service-Disabled Veteran (SDVOSB)' },
  { value: 'hub-zone', label: 'HUBZone Certified' },
  { value: '8a', label: 'SBA 8(a) Certified' },
];

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

interface Profile {
  id?: number; name: string; ein: string; uei: string; naicsCodes: string[];
  state: string; city: string; employeeCount: string; annualRevenue: string;
  ownershipType: string; description: string;
}

const BLANK: Profile = { name: '', ein: '', uei: '', naicsCodes: [], state: '', city: '', employeeCount: '', annualRevenue: '', ownershipType: '', description: '' };

const field = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white text-slate-800 placeholder:text-slate-400";
const label = "text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block";

export default function ProfileSetup() {
  const [profiles, setProfiles] = useState<(Profile & { id: number })[]>([]);
  const [editing, setEditing] = useState<Profile>(BLANK);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [naicsInput, setNaicsInput] = useState('');
  const { toast } = useToast();

  const load = async () => {
    const res = await fetch('/api/profiles');
    if (res.ok) {
      const data = await res.json();
      setProfiles(data.map((p: any) => ({ ...p, naicsCodes: JSON.parse(p.naicsCodes || '[]') })));
    }
  };

  useEffect(() => { load(); }, []);

  const addNaics = (code: string) => {
    const clean = code.trim();
    if (clean && !editing.naicsCodes.includes(clean)) setEditing(p => ({ ...p, naicsCodes: [...p.naicsCodes, clean] }));
    setNaicsInput('');
  };
  const removeNaics = (code: string) => setEditing(p => ({ ...p, naicsCodes: p.naicsCodes.filter(c => c !== code) }));

  const save = async () => {
    if (!editing.name || !editing.state) { toast({ title: 'Business name and state are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const body = { ...editing, employeeCount: editing.employeeCount ? parseInt(editing.employeeCount) : null, annualRevenue: editing.annualRevenue ? parseInt(editing.annualRevenue) : null };
      const url = editingId ? `/api/profiles/${editingId}` : '/api/profiles';
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Save failed');
      await load(); setEditing(BLANK); setEditingId(null); setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: editingId ? 'Profile updated!' : 'Profile created!' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const startEdit = (p: Profile & { id: number }) => { setEditing(p); setEditingId(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const deleteProfile = async (id: number) => { if (!confirm('Delete this profile?')) return; await fetch(`/api/profiles/${id}`, { method: 'DELETE' }); load(); };

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />

      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #4E342E 100%)',
        borderBottom: '1px solid rgba(201,169,110,0.20)',
      }} className="px-6 py-8">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #C9A96E, #8B4513)',
            boxShadow: '0 4px 16px rgba(201,169,110,0.35)',
          }} className="flex items-center justify-center">
            <Building2 style={{ color: '#1B0F0A', width: 22, height: 22 }} />
          </div>
          <div>
            <h1 style={{ color: '#FAF3E8' }} className="text-2xl font-bold m-0">My Business Profile</h1>
            <p style={{ color: 'rgba(250,243,232,0.55)' }} className="text-sm m-0 mt-0.5">
              This info is used to score and match grants to your business
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div style={{ background: 'linear-gradient(135deg, #faf5eb, #fef9ee)', borderBottom: '1px solid #f0e4c8' }} className="px-6 py-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" style={{ color: '#A0522D' }} />
            <h2 className="font-bold text-slate-800 text-sm">{editingId ? 'Edit Profile' : 'Add Business Profile'}</h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Business Name *</label>
                <input className={field} placeholder="Turtle Logistics LLC" value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className={label}>EIN (optional)</label>
                <input className={field} placeholder="XX-XXXXXXX" value={editing.ein} onChange={e => setEditing(p => ({ ...p, ein: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck style={{ width: 12, height: 12, color: '#A0522D' }} />
                SAM.gov UEI <span className="font-normal normal-case tracking-normal text-slate-400 ml-1">(12-character Unique Entity Identifier)</span>
              </label>
              <input className={`${field} font-mono uppercase`} placeholder="e.g. ABC123DEF456" maxLength={12}
                value={editing.uei} onChange={e => setEditing(p => ({ ...p, uei: e.target.value.toUpperCase() }))} />
              <p className="text-xs text-slate-400 mt-1">Find yours at sam.gov → search your business → Entity Overview</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>State *</label>
                <select className={field} value={editing.state} onChange={e => setEditing(p => ({ ...p, state: e.target.value }))}>
                  <option value="">Select state...</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>City</label>
                <input className={field} placeholder="City" value={editing.city} onChange={e => setEditing(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Employees</label>
                <input type="number" className={field} placeholder="12" value={editing.employeeCount} onChange={e => setEditing(p => ({ ...p, employeeCount: e.target.value }))} />
              </div>
              <div>
                <label className={label}>Annual Revenue ($)</label>
                <input type="number" className={field} placeholder="500000" value={editing.annualRevenue} onChange={e => setEditing(p => ({ ...p, annualRevenue: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className={label}>Ownership Type</label>
              <select className={field} value={editing.ownershipType} onChange={e => setEditing(p => ({ ...p, ownershipType: e.target.value }))}>
                {OWNERSHIP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className={label}>NAICS Codes</label>
              <div className="flex gap-2 mb-2">
                <select className={`${field} flex-1`} value="" onChange={e => { if (e.target.value) addNaics(e.target.value); }}>
                  <option value="">Add a suggested code...</option>
                  {NAICS_SUGGESTIONS.map(n => <option key={n.code} value={n.code}>{n.label}</option>)}
                </select>
                <input className="w-28 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Custom..." value={naicsInput} onChange={e => setNaicsInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNaics(naicsInput)} />
                <button onClick={() => addNaics(naicsInput)}
                  className="px-3 py-2 rounded-lg text-sm hover:bg-amber-50 border border-slate-200 hover:border-amber-300">
                  <Plus className="w-4 h-4" style={{ color: '#A0522D' }} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editing.naicsCodes.map(code => (
                  <span key={code} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(160,82,45,0.10)', color: '#8B4513', border: '1px solid rgba(160,82,45,0.25)' }}>
                    {code}
                    <button onClick={() => removeNaics(code)} className="hover:opacity-60"><Trash2 className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className={label}>Business Description</label>
              <textarea className={`${field} resize-none`} rows={3}
                placeholder="Brief description of what your business does, who you serve, and your mission..."
                value={editing.description} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="flex gap-2 pt-1">
              {editingId && (
                <button onClick={() => { setEditing(BLANK); setEditingId(null); }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
              )}
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold ml-auto text-white disabled:opacity-50"
                style={{ background: saved ? '#16a34a' : 'linear-gradient(135deg, #C9A96E, #8B4513)', boxShadow: '0 2px 10px rgba(160,82,45,0.30)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : saved ? 'Saved!' : editingId ? 'Update Profile' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Saved profiles */}
        {profiles.length > 0 && (
          <div>
            <h2 className="font-bold text-slate-700 mb-3 text-xs uppercase tracking-wide">Saved Profiles</h2>
            <div className="space-y-3">
              {profiles.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.state}{p.city ? ` · ${p.city}` : ''} · {p.naicsCodes.join(', ') || 'No NAICS codes'}
                        {p.uei && <span className="ml-2 font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(160,82,45,0.08)', color: '#8B4513' }}>{p.uei}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => startEdit(p)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium">Edit</button>
                      <button onClick={() => deleteProfile(p.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 font-medium">Delete</button>
                    </div>
                  </div>
                  {p.uei ? (
                    <div className="px-4 pb-4"><SamStatus uei={p.uei} profileName={p.name} /></div>
                  ) : (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Add a UEI above to enable SAM.gov registration checks
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
