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
  id?: number;
  name: string;
  ein: string;
  uei: string;
  naicsCodes: string[];
  state: string;
  city: string;
  employeeCount: string;
  annualRevenue: string;
  ownershipType: string;
  description: string;
}

const BLANK: Profile = { name: '', ein: '', uei: '', naicsCodes: [], state: '', city: '', employeeCount: '', annualRevenue: '', ownershipType: '', description: '' };

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
    if (clean && !editing.naicsCodes.includes(clean)) {
      setEditing(p => ({ ...p, naicsCodes: [...p.naicsCodes, clean] }));
    }
    setNaicsInput('');
  };

  const removeNaics = (code: string) => setEditing(p => ({ ...p, naicsCodes: p.naicsCodes.filter(c => c !== code) }));

  const save = async () => {
    if (!editing.name || !editing.state) {
      toast({ title: 'Business name and state are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const body = { ...editing, employeeCount: editing.employeeCount ? parseInt(editing.employeeCount) : null, annualRevenue: editing.annualRevenue ? parseInt(editing.annualRevenue) : null };
      const url = editingId ? `/api/profiles/${editingId}` : '/api/profiles';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Save failed');
      await load();
      setEditing(BLANK);
      setEditingId(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: editingId ? 'Profile updated!' : 'Profile created!' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: Profile & { id: number }) => {
    setEditing(p);
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProfile = async (id: number) => {
    if (!confirm('Delete this profile?')) return;
    await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">My Business Profile</h1>
          <p className="text-slate-500 text-sm">This info is used to score and match grants to your business</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {editingId ? 'Edit Profile' : 'Add Business Profile'}
          </h2>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Business Name *</label>
                <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Turtle Logistics LLC" value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">EIN (optional)</label>
                <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="XX-XXXXXXX" value={editing.ein} onChange={e => setEditing(p => ({ ...p, ein: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SAM.gov UEI <span className="font-normal text-slate-400">(12-character Unique Entity Identifier)</span>
              </label>
              <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="e.g. ABC123DEF456" maxLength={12}
                value={editing.uei} onChange={e => setEditing(p => ({ ...p, uei: e.target.value.toUpperCase() }))} />
              <p className="text-xs text-slate-400 mt-1">Find yours at sam.gov → search your business → Entity Overview</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">State *</label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editing.state} onChange={e => setEditing(p => ({ ...p, state: e.target.value }))}>
                  <option value="">Select state...</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">City</label>
                <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City" value={editing.city} onChange={e => setEditing(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Employees</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12" value={editing.employeeCount} onChange={e => setEditing(p => ({ ...p, employeeCount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Annual Revenue ($)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="500000" value={editing.annualRevenue} onChange={e => setEditing(p => ({ ...p, annualRevenue: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Ownership Type</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editing.ownershipType} onChange={e => setEditing(p => ({ ...p, ownershipType: e.target.value }))}>
                {OWNERSHIP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">NAICS Codes</label>
              <div className="flex gap-2 mb-2">
                <select className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value="" onChange={e => { if (e.target.value) addNaics(e.target.value); }}>
                  <option value="">Add a suggested code...</option>
                  {NAICS_SUGGESTIONS.map(n => <option key={n.code} value={n.code}>{n.label}</option>)}
                </select>
                <input className="w-28 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Custom..." value={naicsInput} onChange={e => setNaicsInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNaics(naicsInput)} />
                <button onClick={() => addNaics(naicsInput)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editing.naicsCodes.map(code => (
                  <span key={code} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                    {code}
                    <button onClick={() => removeNaics(code)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Business Description</label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3} placeholder="Brief description of what your business does, who you serve, and your mission..."
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
                className="flex items-center gap-2 px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 ml-auto">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : saved ? 'Saved!' : editingId ? 'Update Profile' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Existing profiles */}
        {profiles.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-700 mb-3 text-sm">Saved Profiles</h2>
            <div className="space-y-4">
              {profiles.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.state}{p.city ? ` · ${p.city}` : ''} · {p.naicsCodes.join(', ') || 'No NAICS codes'}
                        {p.uei && <span className="ml-2 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{p.uei}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(p)} className="text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600">Edit</button>
                      <button onClick={() => deleteProfile(p.id)} className="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600">Delete</button>
                    </div>
                  </div>
                  {/* SAM.gov status — only show if UEI is set */}
                  {p.uei && (
                    <div className="px-4 pb-4">
                      <SamStatus uei={p.uei} profileName={p.name} />
                    </div>
                  )}
                  {!p.uei && (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Add a UEI above to enable SAM.gov registration checks
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
