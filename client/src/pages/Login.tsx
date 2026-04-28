import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Check } from 'lucide-react';

type Mode = 'login' | 'register';

const PLANS = [
  {
    key: 'starter', label: 'Starter', price: '$29', period: '/mo',
    badge: null,
    tagline: 'Perfect for nonprofits getting started',
    features: ['100 grant searches/month', 'AI match scoring', '5 application drafts/month', '2 business profiles', 'Email digest', 'SAM.gov checks'],
    accent: '#3B82F6',
    accentLight: 'rgba(59,130,246,0.1)',
  },
  {
    key: 'pro', label: 'Pro', price: '$79', period: '/mo',
    badge: 'Most Popular',
    tagline: 'For serious grant seekers',
    features: ['500 searches/month', '20 drafts/month', '5 business profiles', 'Deep web scraping', 'SAM contract search', 'PDF export', 'Priority support'],
    accent: '#7C3AED',
    accentLight: 'rgba(124,58,237,0.1)',
  },
  {
    key: 'business', label: 'Business', price: '$149', period: '/mo',
    badge: null,
    tagline: 'Scale across multiple organizations',
    features: ['Unlimited searches', 'Unlimited drafts', '20 business profiles', 'Everything in Pro', 'Multi-LLC management', 'API access'],
    accent: '#D97706',
    accentLight: 'rgba(217,119,6,0.1)',
  },
  {
    key: 'agency', label: 'Agency', price: '$299', period: '/mo',
    badge: 'For Consultants',
    tagline: 'White-glove for grant consultants',
    features: ['Everything in Business', 'Unlimited client profiles', 'White-label PDF exports', 'Team seat management', 'Dedicated onboarding', 'SLA support'],
    accent: '#BE185D',
    accentLight: 'rgba(190,24,93,0.1)',
  },
];

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const [, navigate] = useLocation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        await register(email, password, name);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --walnut: #3E2723;
          --walnut-light: #5D4037;
          --walnut-dark: #1B0F0A;
          --leather: #8B4513;
          --leather-warm: #A0522D;
          --leather-highlight: #C68B59;
          --cream: #FAF3E8;
          --cream-dark: #F0E4D0;
          --gold: #C9A96E;
          --gold-light: #D4B97A;
          --gold-bright: #E8C980;
          --charcoal: #2C2C2C;
          --text-primary: #1A1A1A;
          --text-secondary: #5C5043;
          --text-light: #8A7D6F;
          --white: #FFFFFF;
        }
        html { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: var(--walnut-dark); }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

        .gsp-page { display: flex; flex-direction: column; }

        /* ─── HERO SPLIT ─── */
        .gsp-split { display: flex; height: 100vh; width: 100%; }

        .gsp-hero {
          flex: 1.15; position: relative; overflow: hidden;
          display: flex; align-items: flex-end; padding: 60px;
        }
        .gsp-hero::before {
          content: ''; position: absolute; inset: 0;
          background:
            linear-gradient(175deg, rgba(27,15,10,0.35) 0%, rgba(62,39,35,0.15) 40%, rgba(139,69,19,0.20) 100%),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,69,19,0.03) 2px, rgba(139,69,19,0.03) 4px),
            repeating-linear-gradient(87deg, transparent, transparent 8px, rgba(93,64,55,0.04) 8px, rgba(93,64,55,0.04) 12px),
            linear-gradient(165deg, #2C1810 0%, #3E2723 25%, #4E342E 45%, #5D4037 65%, #3E2723 85%, #1B0F0A 100%);
          z-index: 0;
        }
        .gsp-hero::after {
          content: ''; position: absolute; top: -20%; right: -10%; width: 80%; height: 80%;
          background: radial-gradient(ellipse, rgba(201,169,110,0.12) 0%, transparent 70%);
          z-index: 1; pointer-events: none;
        }
        .gsp-orb { position: absolute; border-radius: 50%; pointer-events: none; z-index: 1; }
        .gsp-orb-1 { width: 500px; height: 500px; top: 5%; left: 15%; background: radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%); animation: gsp-float 12s ease-in-out infinite; }
        .gsp-orb-2 { width: 350px; height: 350px; bottom: 20%; right: 10%; background: radial-gradient(circle, rgba(160,82,45,0.10) 0%, transparent 70%); animation: gsp-float 16s ease-in-out infinite reverse; }
        .gsp-orb-3 { width: 200px; height: 200px; top: 40%; left: 50%; background: radial-gradient(circle, rgba(232,201,128,0.06) 0%, transparent 70%); animation: gsp-float 10s ease-in-out infinite 2s; }
        @keyframes gsp-float {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(20px,-15px) scale(1.05); }
          66% { transform: translate(-10px,10px) scale(0.97); }
        }
        .gsp-hero-content { position: relative; z-index: 5; max-width: 520px; }
        .gsp-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 18px; background: rgba(201,169,110,0.12);
          border: 1px solid rgba(201,169,110,0.25); border-radius: 100px;
          color: var(--gold-light); font-size: 12px; font-weight: 500;
          letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 28px;
          backdrop-filter: blur(8px); animation: gsp-up 0.8s ease-out 0.2s both;
        }
        .gsp-badge .dot { width: 6px; height: 6px; background: var(--gold); border-radius: 50%; animation: gsp-pulse 2.5s ease-in-out infinite; }
        @keyframes gsp-pulse { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
        .gsp-title { font-family: 'Playfair Display', Georgia, serif; font-size: 48px; font-weight: 600; line-height: 1.15; color: var(--cream); margin-bottom: 20px; letter-spacing: -0.5px; animation: gsp-up 0.8s ease-out 0.35s both; }
        .gsp-title em { font-style: italic; color: var(--gold); }
        .gsp-subtitle { font-size: 17px; font-weight: 300; line-height: 1.7; color: rgba(250,243,232,0.6); margin-bottom: 44px; max-width: 420px; animation: gsp-up 0.8s ease-out 0.5s both; }
        .gsp-stats { display: flex; gap: 40px; animation: gsp-up 0.8s ease-out 0.65s both; }
        .gsp-stat { position: relative; }
        .gsp-stat:not(:last-child)::after { content: ''; position: absolute; right: -20px; top: 4px; height: 36px; width: 1px; background: rgba(201,169,110,0.2); }
        .gsp-stat-num { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 600; color: var(--gold); line-height: 1; margin-bottom: 4px; }
        .gsp-stat-label { font-size: 12px; color: rgba(250,243,232,0.4); letter-spacing: 0.5px; text-transform: uppercase; }
        .gsp-scroll-hint { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); z-index: 5; color: rgba(201,169,110,0.5); font-size: 12px; letter-spacing: 1px; text-transform: uppercase; display: flex; flex-direction: column; align-items: center; gap: 6px; animation: gsp-up 1s ease-out 1.2s both; }
        .gsp-chevron { width: 16px; height: 16px; border-right: 1.5px solid rgba(201,169,110,0.4); border-bottom: 1.5px solid rgba(201,169,110,0.4); transform: rotate(45deg); animation: gsp-bounce 1.6s ease-in-out infinite; }
        @keyframes gsp-bounce { 0%,100% { transform: rotate(45deg) translateY(0); } 50% { transform: rotate(45deg) translateY(4px); } }

        /* ─── LOGIN PANEL ─── */
        .gsp-login {
          flex: 0.85; display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .gsp-login::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(circle at 20% 20%, rgba(139,69,19,0.04) 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, rgba(139,69,19,0.03) 1px, transparent 1px),
            linear-gradient(170deg, #FAF3E8 0%, #F5EBDA 50%, #EDE1CC 100%);
          background-size: 3px 3px, 5px 5px, 100% 100%;
        }
        .gsp-login::after {
          content: ''; position: absolute; left: 0; top: 10%; bottom: 10%;
          width: 1px; background: linear-gradient(to bottom, transparent, var(--gold), transparent); opacity: 0.4;
        }
        .gsp-card { position: relative; z-index: 2; width: 100%; max-width: 400px; padding: 0 40px; }
        .gsp-logo { display: flex; align-items: center; gap: 14px; margin-bottom: 44px; animation: gsp-left 0.7s ease-out 0.3s both; }
        .gsp-logo-icon {
          width: 44px; height: 44px; background: linear-gradient(135deg, var(--walnut) 0%, var(--walnut-light) 100%);
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(62,39,35,0.25); position: relative; overflow: hidden;
        }
        .gsp-logo-icon::after { content: ''; position: absolute; inset: 1px; border-radius: 11px; border: 1px solid rgba(201,169,110,0.15); }
        .gsp-logo-icon svg { width: 22px; height: 22px; fill: none; stroke: var(--gold); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .gsp-logo-text { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: var(--walnut); letter-spacing: -0.3px; }
        .gsp-logo-text span { color: var(--gold); font-weight: 500; }
        .gsp-heading { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; letter-spacing: -0.3px; animation: gsp-left 0.7s ease-out 0.4s both; }
        .gsp-sub { font-size: 15px; font-weight: 300; color: var(--text-light); margin-bottom: 36px; animation: gsp-left 0.7s ease-out 0.45s both; }
        .gsp-form-group { margin-bottom: 22px; position: relative; }
        .gsp-label { display: block; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: 0.3px; }
        .gsp-input-wrap { position: relative; }
        .gsp-input-wrap .gsp-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; stroke: var(--text-light); stroke-width: 1.8; fill: none; transition: stroke 0.3s; pointer-events: none; }
        .gsp-input {
          width: 100%; padding: 14px 16px 14px 48px;
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 400;
          color: var(--text-primary); background: var(--white);
          border: 1.5px solid rgba(62,39,35,0.12); border-radius: 12px; outline: none;
          transition: all 0.3s; box-shadow: 0 1px 3px rgba(62,39,35,0.04);
        }
        .gsp-input::placeholder { color: #BDB2A4; font-weight: 300; }
        .gsp-input:hover { border-color: rgba(62,39,35,0.22); }
        .gsp-input:focus { border-color: var(--gold); box-shadow: 0 0 0 4px rgba(201,169,110,0.12); }
        .gsp-input-wrap:focus-within .gsp-icon { stroke: var(--gold); }
        .gsp-eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 4px; color: var(--text-light); transition: color 0.3s; }
        .gsp-eye:hover { color: var(--walnut); }
        .gsp-options { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; animation: gsp-left 0.7s ease-out 0.6s both; }
        .gsp-forgot { font-size: 14px; color: var(--leather); text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .gsp-forgot:hover { color: var(--walnut); }
        .gsp-btn {
          width: 100%; padding: 15px; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
          color: var(--cream); background: linear-gradient(135deg, var(--walnut) 0%, var(--walnut-light) 100%);
          border: none; border-radius: 12px; cursor: pointer; position: relative; overflow: hidden;
          transition: all 0.4s; box-shadow: 0 4px 16px rgba(62,39,35,0.3); letter-spacing: 0.3px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          animation: gsp-left 0.7s ease-out 0.65s both;
        }
        .gsp-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(62,39,35,0.35); }
        .gsp-btn:active { transform: translateY(0); }
        .gsp-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .gsp-divider { display: flex; align-items: center; gap: 16px; margin: 28px 0; animation: gsp-left 0.7s ease-out 0.7s both; }
        .gsp-divider::before, .gsp-divider::after { content: ''; flex: 1; height: 1px; background: linear-gradient(to right, transparent, rgba(62,39,35,0.12), transparent); }
        .gsp-divider span { font-size: 12px; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; }
        .gsp-signup { text-align: center; font-size: 14px; color: var(--text-light); animation: gsp-left 0.7s ease-out 0.8s both; }
        .gsp-signup button { background: none; border: none; color: var(--leather); text-decoration: none; font-weight: 600; cursor: pointer; transition: color 0.2s; font-size: 14px; font-family: 'Inter', sans-serif; }
        .gsp-signup button:hover { color: var(--walnut); }
        .gsp-error { font-size: 13px; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; }
        .gsp-corner { position: absolute; z-index: 2; opacity: 0.15; }
        .gsp-tl { top: 40px; left: 40px; width: 60px; height: 60px; border-top: 1.5px solid var(--gold); border-left: 1.5px solid var(--gold); }
        .gsp-tr { top: 40px; right: 40px; width: 60px; height: 60px; border-top: 1.5px solid var(--gold); border-right: 1.5px solid var(--gold); }
        .gsp-bl { bottom: 40px; left: 40px; width: 60px; height: 60px; border-bottom: 1.5px solid var(--gold); border-left: 1.5px solid var(--gold); }

        @keyframes gsp-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gsp-left { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

        /* ─── PRICING SECTION ─── */
        .gsp-pricing {
          background: linear-gradient(180deg, #1B0F0A 0%, #2C1810 40%, #1B0F0A 100%);
          padding: 80px 40px;
        }
        .gsp-pricing-inner { max-width: 1100px; margin: 0 auto; }
        .gsp-pricing-eyebrow { text-align: center; color: var(--gold); font-size: 12px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
        .gsp-pricing-title { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 600; color: var(--cream); text-align: center; margin-bottom: 12px; letter-spacing: -0.5px; }
        .gsp-pricing-sub { text-align: center; font-size: 16px; font-weight: 300; color: rgba(250,243,232,0.5); margin-bottom: 56px; }
        .gsp-plans { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .gsp-plan {
          border-radius: 16px; border: 1px solid rgba(201,169,110,0.12);
          background: rgba(255,255,255,0.03); padding: 28px 24px;
          position: relative; transition: transform 0.3s, box-shadow 0.3s;
          backdrop-filter: blur(4px);
        }
        .gsp-plan:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .gsp-plan-popular {
          border-color: rgba(201,169,110,0.35);
          background: rgba(201,169,110,0.06);
          box-shadow: 0 0 0 1px rgba(201,169,110,0.15);
        }
        .gsp-plan-badge {
          position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, var(--walnut) 0%, var(--leather) 100%);
          color: var(--gold-light); font-size: 11px; font-weight: 600;
          letter-spacing: 0.5px; padding: 4px 14px; border-radius: 100px;
          white-space: nowrap; border: 1px solid rgba(201,169,110,0.3);
        }
        .gsp-plan-label { font-size: 13px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
        .gsp-plan-price { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 600; color: var(--cream); line-height: 1; }
        .gsp-plan-period { font-size: 14px; font-weight: 300; color: rgba(250,243,232,0.4); vertical-align: middle; }
        .gsp-plan-tagline { font-size: 13px; color: rgba(250,243,232,0.4); margin-top: 8px; margin-bottom: 24px; font-weight: 300; line-height: 1.5; }
        .gsp-plan-divider { height: 1px; background: rgba(201,169,110,0.1); margin-bottom: 20px; }
        .gsp-plan-features { list-style: none; margin-bottom: 28px; display: flex; flex-direction: column; gap: 10px; }
        .gsp-plan-feature { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: rgba(250,243,232,0.65); font-weight: 300; line-height: 1.4; }
        .gsp-plan-check { width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .gsp-plan-cta {
          width: 100%; padding: 13px; border: none; border-radius: 10px;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.3s; letter-spacing: 0.3px; color: var(--cream);
        }
        .gsp-plan-cta:hover { transform: translateY(-1px); opacity: 0.9; }
        .gsp-pricing-note { text-align: center; margin-top: 32px; font-size: 13px; color: rgba(250,243,232,0.3); }

        @media (max-width: 1024px) {
          .gsp-hero { display: none; }
          .gsp-login { flex: 1; }
          .gsp-plans { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .gsp-plans { grid-template-columns: 1fr; }
          .gsp-pricing { padding: 60px 20px; }
          .gsp-pricing-title { font-size: 30px; }
          .gsp-card { padding: 0 24px; }
        }
      `}</style>

      <div className="gsp-page">
        {/* ─── HERO SPLIT ─── */}
        <div className="gsp-split">

          {/* Left: hero */}
          <div className="gsp-hero">
            <div className="gsp-corner gsp-tl" />
            <div className="gsp-corner gsp-tr" />
            <div className="gsp-corner gsp-bl" />
            <div className="gsp-orb gsp-orb-1" />
            <div className="gsp-orb gsp-orb-2" />
            <div className="gsp-orb gsp-orb-3" />

            <div className="gsp-hero-content">
              <div className="gsp-badge">
                <span className="dot" />
                Trusted by 12,000+ organizations
              </div>

              <h1 className="gsp-title">
                Find the funding<br />
                your vision <em>deserves.</em>
              </h1>

              <p className="gsp-subtitle">
                The most comprehensive grant discovery platform built for nonprofits,
                researchers, and institutions ready to make an impact.
              </p>

              <div className="gsp-stats">
                <div className="gsp-stat">
                  <div className="gsp-stat-num">$48B+</div>
                  <div className="gsp-stat-label">Grants Indexed</div>
                </div>
                <div className="gsp-stat">
                  <div className="gsp-stat-num">15K+</div>
                  <div className="gsp-stat-label">Active Funders</div>
                </div>
                <div className="gsp-stat">
                  <div className="gsp-stat-num">94%</div>
                  <div className="gsp-stat-label">Match Rate</div>
                </div>
              </div>
            </div>

            <div className="gsp-scroll-hint">
              <span>See plans</span>
              <div className="gsp-chevron" />
            </div>
          </div>

          {/* Right: login */}
          <div className="gsp-login">
            <div className="gsp-card">
              <div className="gsp-logo">
                <div className="gsp-logo-icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="21" y2="21" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <div className="gsp-logo-text">Grant Search <span>Pro</span></div>
              </div>

              <h2 className="gsp-heading">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
              <p className="gsp-sub">
                {mode === 'login'
                  ? 'Sign in to continue to your dashboard'
                  : 'Start finding grants in minutes'}
              </p>

              <form onSubmit={submit}>
                {mode === 'register' && (
                  <div className="gsp-form-group">
                    <label className="gsp-label" htmlFor="gsp-name">Full Name</label>
                    <div className="gsp-input-wrap">
                      <input
                        className="gsp-input" id="gsp-name" type="text"
                        placeholder="Your name" autoComplete="name"
                        value={name} onChange={e => setName(e.target.value)} required autoFocus
                      />
                      <svg className="gsp-icon" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="gsp-form-group">
                  <label className="gsp-label" htmlFor="gsp-email">Email Address</label>
                  <div className="gsp-input-wrap">
                    <input
                      className="gsp-input" id="gsp-email" type="email"
                      placeholder="you@organization.org" autoComplete="email"
                      value={email} onChange={e => setEmail(e.target.value)} required
                      autoFocus={mode === 'login'}
                    />
                    <svg className="gsp-icon" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <polyline points="2,4 12,13 22,4" />
                    </svg>
                  </div>
                </div>

                <div className="gsp-form-group">
                  <label className="gsp-label" htmlFor="gsp-password">Password</label>
                  <div className="gsp-input-wrap">
                    <input
                      className="gsp-input" id="gsp-password"
                      type={showPass ? 'text' : 'password'}
                      placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password} onChange={e => setPassword(e.target.value)} required
                    />
                    <svg className="gsp-icon" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <button type="button" className="gsp-eye" onClick={() => setShowPass(s => !s)} aria-label="Toggle password">
                      {showPass ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && <div className="gsp-error">{error}</div>}

                {mode === 'login' && (
                  <div className="gsp-options">
                    <span />
                    <a href="#" className="gsp-forgot">Forgot password?</a>
                  </div>
                )}

                <button type="submit" className="gsp-btn" disabled={loading}>
                  {loading ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : null}
                  {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                  {!loading && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
                    </svg>
                  )}
                </button>
              </form>

              <div className="gsp-divider"><span>or</span></div>

              <p className="gsp-signup">
                {mode === 'login' ? "New to Grant Search Pro? " : 'Already have an account? '}
                <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
                  {mode === 'login' ? 'Create an account' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* ─── PRICING SECTION ─── */}
        <div className="gsp-pricing">
          <div className="gsp-pricing-inner">
            <p className="gsp-pricing-eyebrow">Simple, transparent pricing</p>
            <h2 className="gsp-pricing-title">Choose your plan</h2>
            <p className="gsp-pricing-sub">Start free, upgrade when you're ready. No contracts, cancel anytime.</p>

            <div className="gsp-plans">
              {PLANS.map(plan => (
                <div key={plan.key} className={`gsp-plan${plan.badge === 'Most Popular' ? ' gsp-plan-popular' : ''}`}>
                  {plan.badge && (
                    <div className="gsp-plan-badge">{plan.badge}</div>
                  )}

                  <div className="gsp-plan-label" style={{ color: plan.accent }}>{plan.label}</div>
                  <div>
                    <span className="gsp-plan-price">{plan.price}</span>
                    <span className="gsp-plan-period">{plan.period}</span>
                  </div>
                  <p className="gsp-plan-tagline">{plan.tagline}</p>

                  <div className="gsp-plan-divider" />

                  <ul className="gsp-plan-features">
                    {plan.features.map(f => (
                      <li key={f} className="gsp-plan-feature">
                        <span className="gsp-plan-check" style={{ background: plan.accentLight }}>
                          <Check style={{ width: 10, height: 10, color: plan.accent, strokeWidth: 3 }} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    className="gsp-plan-cta"
                    style={{ background: plan.accent }}
                    onClick={() => { setMode('register'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    Get started
                  </button>
                </div>
              ))}
            </div>

            <p className="gsp-pricing-note">All plans include a 14-day free trial · Credit card required · Cancel anytime before trial ends</p>
          </div>
        </div>
      </div>
    </>
  );
}
