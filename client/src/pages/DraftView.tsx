import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import Nav from '@/components/Nav';
import { Save, ArrowLeft, Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface Draft {
  id: number;
  grantId: number;
  profileId: number;
  fields: Record<string, any>;
  status: string;
}

const FIELD_LABELS: Record<string, string> = {
  project_title: 'Project Title',
  executive_summary: 'Executive Summary',
  organizational_background: 'Organizational Background',
  project_description: 'Project Description',
  goals_and_objectives: 'Goals & Objectives',
  target_population: 'Target Population',
  evaluation_plan: 'Evaluation Plan',
  budget_narrative: 'Budget Narrative',
  sustainability_plan: 'Sustainability Plan',
  certifications: 'Certifications',
};

export default function DraftView() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [fields, setFields] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/drafts').then(r => r.json()).then((drafts: any[]) => {
      const d = drafts.find((x: any) => x.id === parseInt(params.id));
      if (d) {
        setDraft(d);
        try { setFields(JSON.parse(d.fields)); } catch { setFields({}); }
      }
    });
  }, [params.id]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, status: draft.status }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast({ title: 'Draft saved!' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const copyAll = () => {
    const text = Object.entries(FIELD_LABELS).map(([key, label]) => {
      const val = fields[key];
      if (!val) return '';
      const content = Array.isArray(val) ? val.map((v: string, i: number) => `  ${i + 1}. ${v}`).join('\n') : val;
      return `## ${label}\n${content}`;
    }).filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard!' });
  };

  if (!draft) return (
    <div><Nav /><div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div></div>
  );

  return (
    <div>
      <Nav />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Tracker
          </button>
          <div className="flex gap-2">
            <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              Copy All
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm mb-2">
          <p className="text-xs text-slate-400 px-3 py-2">Draft #{draft.id} · Edit any field below, then save or copy to clipboard</p>
        </div>

        <div className="space-y-4">
          {Object.entries(FIELD_LABELS).map(([key, label]) => {
            const val = fields[key];
            if (val === undefined) return null;

            return (
              <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</label>
                {Array.isArray(val) ? (
                  <div className="space-y-1.5">
                    {val.map((item: string, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-slate-400 text-sm mt-2 w-5 shrink-0">{i + 1}.</span>
                        <input
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={item}
                          onChange={e => {
                            const updated = [...val];
                            updated[i] = e.target.value;
                            setFields(f => ({ ...f, [key]: updated }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <textarea
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={key === 'project_title' || key === 'target_population' ? 1 : key === 'executive_summary' || key === 'project_description' ? 8 : 4}
                    value={val || ''}
                    onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
