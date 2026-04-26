import { useLocation } from 'wouter';
import { LayoutDashboard, Search, Building2, FileText, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Find Grants', icon: Search },
  { href: '/deep-search', label: 'Deep Search', icon: Globe },
  { href: '/profile', label: 'My Business', icon: Building2 },
];

export default function Nav() {
  const [location, navigate] = useLocation();
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 h-14">
        <div className="flex items-center gap-2 mr-6">
          <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">Grant Intelligence</span>
        </div>
        {links.map(({ href, label, icon: Icon }) => (
          <button
            key={href}
            onClick={() => navigate(href)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              location === href
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
