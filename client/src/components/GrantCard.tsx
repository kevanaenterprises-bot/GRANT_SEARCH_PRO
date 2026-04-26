import { useState } from 'react';
import { Flame, Thermometer, Snowflake, ExternalLink, BookmarkPlus, Loader2, Calendar, Building2, DollarSign } from 'lucide-react';
import { cn, formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface Grant {
  opportunityId: string;
  title: string;
  agency?: string;
  description?: string;
  awardCeiling?: number;
  awardFloor?: number;
  closeDate?: string;
  postDate?: string;
  category?: string;
  cfda?: string;
  link?: string;
  rawData?: string;
  matchScore?: number;
  matchReasoning?: string;
  tier?: 'hot' | 'warm' | 'cold';
  scoreSummary?: string;
}

interface GrantCardProps {
  grant: Grant;
  profileId?: number;
  onSaved?: () => void;
  showSaveButton?: boolean;
}

const tierConfig = {
  hot: { icon: Flame, color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: 'Hot Match' },
  warm: { icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', label: 'Warm Match' },
  cold: { icon: Snowflake, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200', label: 'Low Match' },
};

export default function GrantCard({ grant, profileId, onSaved, showSaveButton = true }: GrantCardProps) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const tier = grant.tier || (grant.matchScore != null ? (grant.matchScore >= 80 ? 'hot' : grant.matchScore >= 50 ? 'warm' : 'cold') : undefined);
  const TierIcon = tier ? tierConfig[tier].icon : null;
  const days = daysUntil(grant.closeDate);

  const save = async () => {
    if (!profileId) { toast({ title: 'Set up your business profile first', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/grants/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...grant, profileId }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Grant saved!', description: grant.title.slice(0, 60) });
      onSaved?.();
    } catch (err: any) {
      toast({ title: 'Error saving grant', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow', tier ? tierConfig[tier].bg : 'border-slate-200')}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {TierIcon && tier && (
              <span className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', tierConfig[tier].color, 'bg-white/80')}>
                <TierIcon className="w-3 h-3" />
                {grant.matchScore != null ? `${Math.round(grant.matchScore)}%` : tierConfig[tier].label}
              </span>
            )}
            {days != null && days <= 14 && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                {days <= 0 ? 'Closed' : `${days}d left`}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{grant.title}</h3>
        </div>
        <div className="flex gap-1 shrink-0">
          {grant.link && (
            <a href={grant.link} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {showSaveButton && (
            <button onClick={save} disabled={saving}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-2">
        {grant.agency && (
          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{grant.agency}</span>
        )}
        {(grant.awardCeiling || grant.awardFloor) && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {grant.awardFloor && grant.awardCeiling
              ? `${formatCurrency(grant.awardFloor)} – ${formatCurrency(grant.awardCeiling)}`
              : formatCurrency(grant.awardCeiling || grant.awardFloor)}
          </span>
        )}
        {grant.closeDate && (
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Closes {formatDate(grant.closeDate)}</span>
        )}
      </div>

      {grant.scoreSummary && (
        <p className="text-xs text-slate-600 bg-white/70 rounded-lg p-2 mt-2 border border-slate-100">{grant.scoreSummary}</p>
      )}

      {!grant.scoreSummary && grant.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{grant.description}</p>
      )}
    </div>
  );
}

export type { Grant };
