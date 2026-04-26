import { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Loader2, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface SamStatusProps {
  uei: string;
  profileName: string;
}

interface StatusResult {
  uei: string;
  found: boolean;
  isActive: boolean;
  isExcluded: boolean;
  exclusionCount: number;
  daysUntilExpiry: number | null;
  expiringWithin30Days: boolean;
  summary: string;
  entity: {
    legalName: string;
    cageCode?: string;
    registrationStatus: string;
    expirationDate?: string;
    registrationDate?: string;
    address: { city?: string; state?: string; zip?: string };
    naicsCodes: { code: string; isPrimary: boolean; label?: string }[];
    smallBusinessDesignations: Record<string, boolean>;
    purposeOfRegistration?: string;
  } | null;
}

const DESIGNATION_LABELS: Record<string, string> = {
  sba8a: '8(a)',
  hubzone: 'HUBZone',
  wosb: 'WOSB',
  edwosb: 'EDWOSB',
  veteranOwned: 'Veteran-Owned',
  serviceDisabledVeteran: 'SDVOSB',
};

export default function SamStatus({ uei, profileName }: SamStatusProps) {
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sam/status/${uei.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data);
      setExpanded(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = !status
    ? 'border-slate-200 bg-slate-50'
    : status.isExcluded
    ? 'border-red-300 bg-red-50'
    : !status.isActive
    ? 'border-orange-300 bg-orange-50'
    : status.expiringWithin30Days
    ? 'border-yellow-300 bg-yellow-50'
    : 'border-green-300 bg-green-50';

  const StatusIcon = !status
    ? ShieldCheck
    : status.isExcluded || !status.isActive
    ? ShieldX
    : status.expiringWithin30Days
    ? ShieldAlert
    : ShieldCheck;

  const iconColor = !status
    ? 'text-slate-400'
    : status.isExcluded
    ? 'text-red-500'
    : !status.isActive
    ? 'text-orange-500'
    : status.expiringWithin30Days
    ? 'text-yellow-600'
    : 'text-green-600';

  return (
    <div className={cn('rounded-xl border p-4 transition-colors', statusColor)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-5 h-5', iconColor)} />
          <div>
            <p className="text-sm font-semibold text-slate-800">SAM.gov Registration</p>
            <p className="text-xs text-slate-500">UEI: {uei.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={check}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 font-medium"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {status ? 'Refresh' : 'Check Status'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {status && (
        <div className="mt-3">
          <p className={cn('text-sm font-medium',
            status.isExcluded ? 'text-red-700' :
            !status.isActive ? 'text-orange-700' :
            status.expiringWithin30Days ? 'text-yellow-700' :
            'text-green-700'
          )}>{status.summary}</p>

          {expanded && status.entity && (
            <div className="mt-3 space-y-3">
              {/* Core info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/70 rounded-lg p-2">
                  <p className="text-slate-400 font-medium uppercase tracking-wide mb-0.5">Legal Name</p>
                  <p className="text-slate-800 font-medium">{status.entity.legalName}</p>
                </div>
                {status.entity.cageCode && (
                  <div className="bg-white/70 rounded-lg p-2">
                    <p className="text-slate-400 font-medium uppercase tracking-wide mb-0.5">CAGE Code</p>
                    <p className="text-slate-800 font-mono font-medium">{status.entity.cageCode}</p>
                  </div>
                )}
                <div className="bg-white/70 rounded-lg p-2">
                  <p className="text-slate-400 font-medium uppercase tracking-wide mb-0.5">Status</p>
                  <p className={cn('font-semibold', status.isActive ? 'text-green-700' : 'text-red-600')}>
                    {status.entity.registrationStatus}
                  </p>
                </div>
                {status.entity.expirationDate && (
                  <div className="bg-white/70 rounded-lg p-2">
                    <p className="text-slate-400 font-medium uppercase tracking-wide mb-0.5">Expires</p>
                    <p className={cn('font-medium', status.expiringWithin30Days ? 'text-yellow-700 font-bold' : 'text-slate-800')}>
                      {formatDate(status.entity.expirationDate)}
                      {status.daysUntilExpiry != null && ` (${status.daysUntilExpiry}d)`}
                    </p>
                  </div>
                )}
              </div>

              {/* Small business designations */}
              {Object.entries(status.entity.smallBusinessDesignations).some(([, v]) => v) && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1.5">Certifications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(status.entity.smallBusinessDesignations)
                      .filter(([, active]) => active)
                      .map(([key]) => (
                        <span key={key} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {DESIGNATION_LABELS[key] || key}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* NAICS codes from SAM */}
              {status.entity.naicsCodes.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1.5">NAICS in SAM.gov</p>
                  <div className="flex flex-wrap gap-1.5">
                    {status.entity.naicsCodes.slice(0, 8).map(n => (
                      <span key={n.code} className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        n.isPrimary ? 'bg-blue-700 text-white font-semibold' : 'bg-slate-100 text-slate-600'
                      )}>
                        {n.code}{n.isPrimary ? ' (primary)' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <a
                href={`https://sam.gov/entity/${uei}/core`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> View on SAM.gov
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
