import { useLocation } from 'wouter';
import { LayoutDashboard, Search, Building2, FileText, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Find Grants', icon: Search },
  { href: '/deep-search', label: 'Deep Search', icon: Globe },
  { href: '/profile', label: 'My Business', icon: Building2 },
];

export default function Nav() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  return (
    <nav style={{
      background: 'linear-gradient(135deg, #2C1810 0%, #3E2723 60%, #4E342E 100%)',
      borderBottom: '1px solid rgba(201,169,110,0.18)',
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6, height: 56 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 20 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, #C9A96E, #8B4513)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(201,169,110,0.30)',
          }}>
            <FileText style={{ width: 15, height: 15, color: '#1B0F0A' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#FAF3E8', letterSpacing: '-0.2px' }}>Grant Intelligence</span>
        </div>

        {/* Nav links */}
        {links.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <button
              key={href}
              onClick={() => navigate(href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: 'pointer', border: 'none',
                background: active ? 'rgba(201,169,110,0.18)' : 'transparent',
                color: active ? '#C9A96E' : 'rgba(250,243,232,0.55)',
                boxShadow: active ? 'inset 0 0 0 1px rgba(201,169,110,0.35)' : 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(250,243,232,0.85)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(250,243,232,0.55)'; }}
            >
              <Icon style={{ width: 14, height: 14 }} />
              {label}
            </button>
          );
        })}

        {/* Account avatar */}
        {user && (
          <button
            onClick={() => navigate('/account')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '5px 10px 5px 6px', borderRadius: 20, marginLeft: 'auto',
              background: location === '/account' ? 'rgba(201,169,110,0.18)' : 'rgba(250,243,232,0.07)',
              border: location === '/account' ? '1px solid rgba(201,169,110,0.40)' : '1px solid rgba(250,243,232,0.12)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, #C9A96E, #8B4513)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#1B0F0A',
            }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(250,243,232,0.75)' }} className="hidden sm:inline">
              {user.name?.split(' ')[0]}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
