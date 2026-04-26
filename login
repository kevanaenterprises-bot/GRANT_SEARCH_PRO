<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Grant Search Pro — Sign In</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
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
    --shadow-soft: 0 4px 24px rgba(62, 39, 35, 0.12);
    --shadow-medium: 0 8px 40px rgba(62, 39, 35, 0.18);
    --shadow-heavy: 0 16px 64px rgba(62, 39, 35, 0.25);
  }

  html, body {
    height: 100%;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--walnut-dark);
    overflow: hidden;
  }

  /* ─── FULL-PAGE LAYOUT ─── */
  .page {
    display: flex;
    height: 100vh;
    width: 100vw;
  }

  /* ─── LEFT PANEL — THE "LIBRARY" ─── */
  .hero-panel {
    flex: 1.15;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    padding: 60px;
  }

  /* Layered wood/leather background */
  .hero-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(175deg,
        rgba(27, 15, 10, 0.35) 0%,
        rgba(62, 39, 35, 0.15) 40%,
        rgba(139, 69, 19, 0.20) 100%
      ),
      /* Wood grain texture via repeating gradients */
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 2px,
        rgba(139, 69, 19, 0.03) 2px,
        rgba(139, 69, 19, 0.03) 4px
      ),
      repeating-linear-gradient(
        87deg,
        transparent,
        transparent 8px,
        rgba(93, 64, 55, 0.04) 8px,
        rgba(93, 64, 55, 0.04) 12px
      ),
      linear-gradient(165deg,
        #2C1810 0%,
        #3E2723 25%,
        #4E342E 45%,
        #5D4037 65%,
        #3E2723 85%,
        #1B0F0A 100%
      );
    z-index: 0;
  }

  /* Warm ambient light effect */
  .hero-panel::after {
    content: '';
    position: absolute;
    top: -20%;
    right: -10%;
    width: 80%;
    height: 80%;
    background: radial-gradient(ellipse, rgba(201, 169, 110, 0.12) 0%, transparent 70%);
    z-index: 1;
    pointer-events: none;
  }

  /* Floating light orbs for depth */
  .light-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    z-index: 1;
  }
  .light-orb.orb-1 {
    width: 500px; height: 500px;
    top: 5%; left: 15%;
    background: radial-gradient(circle, rgba(201, 169, 110, 0.08) 0%, transparent 70%);
    animation: float 12s ease-in-out infinite;
  }
  .light-orb.orb-2 {
    width: 350px; height: 350px;
    bottom: 20%; right: 10%;
    background: radial-gradient(circle, rgba(160, 82, 45, 0.10) 0%, transparent 70%);
    animation: float 16s ease-in-out infinite reverse;
  }
  .light-orb.orb-3 {
    width: 200px; height: 200px;
    top: 40%; left: 50%;
    background: radial-gradient(circle, rgba(232, 201, 128, 0.06) 0%, transparent 70%);
    animation: float 10s ease-in-out infinite 2s;
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(20px, -15px) scale(1.05); }
    66% { transform: translate(-10px, 10px) scale(0.97); }
  }

  .hero-content {
    position: relative;
    z-index: 5;
    max-width: 520px;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    background: rgba(201, 169, 110, 0.12);
    border: 1px solid rgba(201, 169, 110, 0.25);
    border-radius: 100px;
    color: var(--gold-light);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 28px;
    backdrop-filter: blur(8px);
  }
  .hero-badge .dot {
    width: 6px; height: 6px;
    background: var(--gold);
    border-radius: 50%;
    animation: pulse-dot 2.5s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.3); }
  }

  .hero-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 48px;
    font-weight: 600;
    line-height: 1.15;
    color: var(--cream);
    margin-bottom: 20px;
    letter-spacing: -0.5px;
  }
  .hero-title em {
    font-style: italic;
    color: var(--gold);
  }

  .hero-subtitle {
    font-size: 17px;
    font-weight: 300;
    line-height: 1.7;
    color: rgba(250, 243, 232, 0.6);
    margin-bottom: 44px;
    max-width: 420px;
  }

  /* Stats row */
  .hero-stats {
    display: flex;
    gap: 40px;
  }
  .stat-item {
    position: relative;
  }
  .stat-item:not(:last-child)::after {
    content: '';
    position: absolute;
    right: -20px;
    top: 4px;
    height: 36px;
    width: 1px;
    background: rgba(201, 169, 110, 0.2);
  }
  .stat-number {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 4px;
  }
  .stat-label {
    font-size: 12px;
    color: rgba(250, 243, 232, 0.4);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* ─── RIGHT PANEL — LOGIN ─── */
  .login-panel {
    flex: 0.85;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  /* Leather-textured background */
  .login-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      /* Subtle leather stipple */
      radial-gradient(circle at 20% 20%, rgba(139, 69, 19, 0.04) 1px, transparent 1px),
      radial-gradient(circle at 80% 80%, rgba(139, 69, 19, 0.03) 1px, transparent 1px),
      /* Base warm cream */
      linear-gradient(170deg, #FAF3E8 0%, #F5EBDA 50%, #EDE1CC 100%);
    background-size: 3px 3px, 5px 5px, 100% 100%;
  }

  /* Gold accent line on left edge */
  .login-panel::after {
    content: '';
    position: absolute;
    left: 0; top: 10%; bottom: 10%;
    width: 1px;
    background: linear-gradient(to bottom, transparent, var(--gold), transparent);
    opacity: 0.4;
  }

  .login-card {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 400px;
    padding: 0 40px;
  }

  /* Logo mark */
  .logo-group {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 44px;
  }
  .logo-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, var(--walnut) 0%, var(--walnut-light) 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(62, 39, 35, 0.25);
    position: relative;
    overflow: hidden;
  }
  .logo-icon::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 11px;
    border: 1px solid rgba(201, 169, 110, 0.15);
  }
  .logo-icon svg {
    width: 22px; height: 22px;
    fill: none;
    stroke: var(--gold);
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .logo-text {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--walnut);
    letter-spacing: -0.3px;
  }
  .logo-text span {
    color: var(--gold);
    font-weight: 500;
  }

  .login-heading {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
    letter-spacing: -0.3px;
  }
  .login-sub {
    font-size: 15px;
    font-weight: 300;
    color: var(--text-light);
    margin-bottom: 36px;
  }

  /* ─── FORM STYLES ─── */
  .form-group {
    margin-bottom: 22px;
    position: relative;
  }
  .form-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 8px;
    letter-spacing: 0.3px;
  }
  .input-wrapper {
    position: relative;
  }
  .input-wrapper svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px; height: 18px;
    stroke: var(--text-light);
    stroke-width: 1.8;
    fill: none;
    transition: stroke 0.3s;
    pointer-events: none;
  }
  .form-input {
    width: 100%;
    padding: 14px 16px 14px 48px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 400;
    color: var(--text-primary);
    background: var(--white);
    border: 1.5px solid rgba(62, 39, 35, 0.12);
    border-radius: 12px;
    outline: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(62, 39, 35, 0.04);
  }
  .form-input::placeholder {
    color: #BDB2A4;
    font-weight: 300;
  }
  .form-input:hover {
    border-color: rgba(62, 39, 35, 0.22);
  }
  .form-input:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 4px rgba(201, 169, 110, 0.12), 0 1px 3px rgba(62, 39, 35, 0.04);
  }
  .form-input:focus + svg,
  .form-input:focus ~ svg {
    stroke: var(--gold);
  }
  .input-wrapper:focus-within svg {
    stroke: var(--gold);
  }

  .toggle-password {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--text-light);
    transition: color 0.3s;
  }
  .toggle-password:hover { color: var(--walnut); }
  .toggle-password svg {
    position: static;
    transform: none;
    width: 18px; height: 18px;
    stroke: currentColor;
  }

  /* Remember / Forgot row */
  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }
  .remember-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-secondary);
    user-select: none;
  }
  .remember-label input { display: none; }
  .custom-check {
    width: 18px; height: 18px;
    border: 1.5px solid rgba(62, 39, 35, 0.2);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    background: var(--white);
    flex-shrink: 0;
  }
  .remember-label input:checked ~ .custom-check {
    background: var(--walnut);
    border-color: var(--walnut);
  }
  .custom-check svg {
    width: 12px; height: 12px;
    stroke: white;
    stroke-width: 2.5;
    fill: none;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.2s;
  }
  .remember-label input:checked ~ .custom-check svg {
    opacity: 1;
    transform: scale(1);
  }
  .forgot-link {
    font-size: 14px;
    color: var(--leather);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }
  .forgot-link:hover { color: var(--walnut); }

  /* CTA button */
  .btn-signin {
    width: 100%;
    padding: 15px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--cream);
    background: linear-gradient(135deg, var(--walnut) 0%, var(--walnut-light) 100%);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(62, 39, 35, 0.3);
    letter-spacing: 0.3px;
  }
  .btn-signin::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--walnut-light) 0%, var(--leather) 100%);
    opacity: 0;
    transition: opacity 0.4s;
  }
  .btn-signin:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(62, 39, 35, 0.35);
  }
  .btn-signin:hover::before { opacity: 1; }
  .btn-signin:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(62, 39, 35, 0.25);
  }
  .btn-signin span {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn-signin svg {
    width: 18px; height: 18px;
    stroke: var(--cream);
    stroke-width: 2;
    fill: none;
    transition: transform 0.3s;
  }
  .btn-signin:hover svg {
    transform: translateX(3px);
  }

  /* Divider */
  .divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 28px 0;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(62, 39, 35, 0.12), transparent);
  }
  .divider span {
    font-size: 12px;
    color: var(--text-light);
    text-transform: uppercase;
    letter-spacing: 1px;
    white-space: nowrap;
  }

  /* Social buttons */
  .social-row {
    display: flex;
    gap: 12px;
    margin-bottom: 32px;
  }
  .btn-social {
    flex: 1;
    padding: 12px;
    background: var(--white);
    border: 1.5px solid rgba(62, 39, 35, 0.1);
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    transition: all 0.3s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .btn-social:hover {
    border-color: rgba(62, 39, 35, 0.22);
    background: #FEFCF9;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(62, 39, 35, 0.08);
  }
  .btn-social svg {
    width: 20px; height: 20px;
    flex-shrink: 0;
  }

  /* Sign up link */
  .signup-prompt {
    text-align: center;
    font-size: 14px;
    color: var(--text-light);
  }
  .signup-prompt a {
    color: var(--leather);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
  }
  .signup-prompt a:hover { color: var(--walnut); }

  /* ─── DECORATIVE CORNER ACCENTS ─── */
  .corner-accent {
    position: absolute;
    z-index: 2;
    opacity: 0.15;
  }
  .corner-accent.top-left {
    top: 40px; left: 40px;
    width: 60px; height: 60px;
    border-top: 1.5px solid var(--gold);
    border-left: 1.5px solid var(--gold);
  }
  .corner-accent.top-right {
    top: 40px; right: 40px;
    width: 60px; height: 60px;
    border-top: 1.5px solid var(--gold);
    border-right: 1.5px solid var(--gold);
  }
  .corner-accent.bottom-left {
    bottom: 40px; left: 40px;
    width: 60px; height: 60px;
    border-bottom: 1.5px solid var(--gold);
    border-left: 1.5px solid var(--gold);
  }

  /* ─── ENTRANCE ANIMATIONS ─── */
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideLeft {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .hero-badge { animation: fadeSlideUp 0.8s ease-out 0.2s both; }
  .hero-title { animation: fadeSlideUp 0.8s ease-out 0.35s both; }
  .hero-subtitle { animation: fadeSlideUp 0.8s ease-out 0.5s both; }
  .hero-stats { animation: fadeSlideUp 0.8s ease-out 0.65s both; }
  .logo-group { animation: fadeSlideLeft 0.7s ease-out 0.3s both; }
  .login-heading { animation: fadeSlideLeft 0.7s ease-out 0.4s both; }
  .login-sub { animation: fadeSlideLeft 0.7s ease-out 0.45s both; }
  .form-group:nth-child(1) { animation: fadeSlideLeft 0.7s ease-out 0.5s both; }
  .form-group:nth-child(2) { animation: fadeSlideLeft 0.7s ease-out 0.55s both; }
  .form-options { animation: fadeSlideLeft 0.7s ease-out 0.6s both; }
  .btn-signin { animation: fadeSlideLeft 0.7s ease-out 0.65s both; }
  .divider { animation: fadeSlideLeft 0.7s ease-out 0.7s both; }
  .social-row { animation: fadeSlideLeft 0.7s ease-out 0.75s both; }
  .signup-prompt { animation: fadeSlideLeft 0.7s ease-out 0.8s both; }

  /* ─── RESPONSIVE ─── */
  @media (max-width: 1024px) {
    .hero-panel { display: none; }
    .login-panel { flex: 1; }
  }
  @media (max-width: 480px) {
    .login-card { padding: 0 24px; }
    .social-row { flex-direction: column; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- ─── LEFT: HERO PANEL ─── -->
  <div class="hero-panel">
    <div class="corner-accent top-left"></div>
    <div class="corner-accent top-right"></div>
    <div class="corner-accent bottom-left"></div>

    <div class="light-orb orb-1"></div>
    <div class="light-orb orb-2"></div>
    <div class="light-orb orb-3"></div>

    <div class="hero-content">
      <div class="hero-badge">
        <span class="dot"></span>
        Trusted by 12,000+ organizations
      </div>

      <h1 class="hero-title">
        Find the funding<br>
        your vision <em>deserves.</em>
      </h1>

      <p class="hero-subtitle">
        The most comprehensive grant discovery platform built for nonprofits, researchers, and institutions ready to make an impact.
      </p>

      <div class="hero-stats">
        <div class="stat-item">
          <div class="stat-number">$48B+</div>
          <div class="stat-label">Grants Indexed</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">15K+</div>
          <div class="stat-label">Active Funders</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">94%</div>
          <div class="stat-label">Match Rate</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ─── RIGHT: LOGIN PANEL ─── -->
  <div class="login-panel">
    <div class="login-card">

      <!-- Logo -->
      <div class="logo-group">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"/>
            <line x1="16.5" y1="16.5" x2="21" y2="21"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>
        <div class="logo-text">Grant Search <span>Pro</span></div>
      </div>

      <h2 class="login-heading">Welcome back</h2>
      <p class="login-sub">Sign in to continue to your dashboard</p>

      <!-- Form -->
      <form onsubmit="event.preventDefault();">
        <div class="form-group">
          <label class="form-label" for="email">Email Address</label>
          <div class="input-wrapper">
            <input class="form-input" id="email" type="email" placeholder="you@organization.org" autocomplete="email">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <polyline points="2,4 12,13 22,4"/>
            </svg>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <div class="input-wrapper">
            <input class="form-input" id="password" type="password" placeholder="Enter your password" autocomplete="current-password">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <button type="button" class="toggle-password" onclick="togglePass()" aria-label="Show password">
              <svg id="eye-icon" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke-width="1.8">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="remember-label">
            <input type="checkbox">
            <span class="custom-check">
              <svg viewBox="0 0 12 12" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="2.5,6 5,8.5 9.5,3.5"/>
              </svg>
            </span>
            Remember me
          </label>
          <a href="#" class="forgot-link">Forgot password?</a>
        </div>

        <button type="submit" class="btn-signin">
          <span>
            Sign In
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12,5 19,12 12,19"/>
            </svg>
          </span>
        </button>
      </form>

      <div class="divider"><span>or continue with</span></div>

      <div class="social-row">
        <button class="btn-social">
          <svg viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
        <button class="btn-social">
          <svg viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>
      </div>

      <p class="signup-prompt">
        New to Grant Search Pro? <a href="#">Create an account</a>
      </p>
    </div>
  </div>

</div>

<script>
  function togglePass() {
    const pw = document.getElementById('password');
    const icon = document.getElementById('eye-icon');
    if (pw.type === 'password') {
      pw.type = 'text';
      icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
    } else {
      pw.type = 'password';
      icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    }
  }
</script>
</body>
</html>
