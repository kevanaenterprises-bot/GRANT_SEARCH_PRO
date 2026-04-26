import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Anthropic from '@anthropic-ai/sdk';
import { db } from './db.js';
import { businessProfiles } from './schema.js';
import { buildKeywordsFromProfile, searchGrantsGov } from './routes/grants.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getTransport() {
  // Uses Gmail by default. Set SMTP_* env vars to use any provider.
  // For Gmail: enable "App Passwords" and use that as SMTP_PASS
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return null;
}

async function batchScore(grants: any[], profile: any): Promise<any[]> {
  if (!grants.length) return [];
  const naics = JSON.parse(profile.naicsCodes || '[]');
  const grantList = grants.map((g: any, i: number) =>
    `[${i}] "${g.title}" | ${g.agency || 'unknown'} | Award: ${g.awardCeiling ? `$${g.awardCeiling.toLocaleString()}` : 'unspecified'} | ${g.description?.slice(0, 150) || ''}`
  ).join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Score these grants for: ${profile.name} | ${profile.state} | NAICS: ${naics.join(', ')} | ${profile.ownershipType || 'small business'}\n\n${grantList}\n\nReturn JSON array: [{"score":0-100,"tier":"hot|warm|cold","summary":"1 sentence"}]`
    }],
  });

  const text = (message.content[0] as any).text;
  const match = text.match(/\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : [];
}

function buildEmailHtml(profile: any, hotGrants: any[]): string {
  const rows = hotGrants.map(g => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e2e8f0;">
        <div style="font-weight:600;color:#1e3a5f;">${g.title}</div>
        <div style="color:#64748b;font-size:13px;margin-top:2px;">${g.agency || ''}</div>
        <div style="color:#475569;font-size:13px;margin-top:4px;">${g.scoreSummary || ''}</div>
      </td>
      <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center;white-space:nowrap;">
        <span style="background:${g.score >= 80 ? '#fef2f2' : '#fffbeb'};color:${g.score >= 80 ? '#dc2626' : '#d97706'};padding:4px 10px;border-radius:20px;font-size:13px;font-weight:700;">${Math.round(g.score)}%</span>
      </td>
      <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center;white-space:nowrap;">
        <div style="font-size:13px;color:#475569;">${g.awardCeiling ? `$${(g.awardCeiling / 1000).toFixed(0)}K` : '—'}</div>
      </td>
      <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center;">
        <div style="font-size:12px;color:${g.daysLeft != null && g.daysLeft <= 14 ? '#dc2626' : '#64748b'};font-weight:${g.daysLeft != null && g.daysLeft <= 14 ? '700' : '400'};">${g.daysLeft != null ? `${g.daysLeft}d` : '—'}</div>
      </td>
      <td style="padding:12px;border-bottom:1px solid #e2e8f0;">
        <a href="${g.link || '#'}" style="color:#2563eb;font-size:13px;">View →</a>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px;">
      <div style="max-width:700px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#1d4ed8,#0f172a);padding:28px 32px;color:white;">
          <div style="font-size:20px;font-weight:700;">📋 Grant Intelligence Digest</div>
          <div style="opacity:0.8;margin-top:4px;font-size:14px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>

        <div style="padding:24px 32px;">
          <p style="color:#475569;margin-top:0;">Here are this week's top grant matches for <strong>${profile.name}</strong>:</p>

          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Grant</th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Match</th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Award</th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Closes</th>
                <th style="padding:10px 12px;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;border-bottom:2px solid #e2e8f0;"></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:8px;border-left:4px solid #2563eb;">
            <div style="font-size:13px;color:#1e40af;font-weight:600;">💡 Tip</div>
            <div style="font-size:13px;color:#1e3a5f;margin-top:4px;">Open the app to generate application drafts for any of these grants in seconds.</div>
          </div>
        </div>

        <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">Grant Intelligence by Turtle Logistics LLC · Automated weekly digest</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function runDigest(force = false) {
  const transport = getTransport();
  const toEmail = process.env.DIGEST_EMAIL;

  if (!transport || !toEmail) {
    console.log('⚠️  Email digest skipped — set SMTP_USER, SMTP_PASS, and DIGEST_EMAIL in .env');
    return;
  }

  console.log('📧 Running grant digest...');
  const profiles = await db.select().from(businessProfiles);

  for (const profile of profiles) {
    const keywords = buildKeywordsFromProfile(profile);
    const searches = keywords.slice(0, 2).map(kw => searchGrantsGov(kw, 10, 0, 'posted'));
    const results = await Promise.allSettled(searches);

    const seen = new Set<string>();
    const grants: any[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        for (const g of r.value.grants) {
          if (!seen.has(g.opportunityId)) { seen.add(g.opportunityId); grants.push(g); }
        }
      }
    }

    if (!grants.length) continue;

    const scores = await batchScore(grants.slice(0, 15), profile);
    const scored = grants.slice(0, 15).map((g, i) => ({
      ...g,
      score: scores[i]?.score || 0,
      tier: scores[i]?.tier || 'cold',
      scoreSummary: scores[i]?.summary || '',
      daysLeft: g.closeDate ? Math.ceil((new Date(g.closeDate).getTime() - Date.now()) / 86400000) : null,
    })).filter(g => g.score >= 60).sort((a, b) => b.score - a.score).slice(0, 8);

    if (!scored.length) {
      console.log(`No hot/warm matches found for ${profile.name} this week`);
      continue;
    }

    const html = buildEmailHtml(profile, scored);
    await transport.sendMail({
      from: `"Grant Intelligence" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `🔥 ${scored.filter(g => g.score >= 80).length} hot grant matches for ${profile.name}`,
      html,
    });
    console.log(`✅ Digest sent to ${toEmail} — ${scored.length} matches for ${profile.name}`);
  }
}

// Schedule: every Monday at 8am
export function startDigestCron() {
  const schedule = process.env.DIGEST_CRON || '0 8 * * 1';
  cron.schedule(schedule, () => runDigest());
  console.log(`📅 Email digest scheduled: ${schedule}`);
}
