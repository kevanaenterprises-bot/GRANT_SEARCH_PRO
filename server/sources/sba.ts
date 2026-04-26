// SBA (Small Business Administration) grant and funding opportunities
// Uses SBA's public API and known program listings

export interface ExternalGrant {
  opportunityId: string;
  title: string;
  agency: string;
  description: string;
  awardCeiling: number | null;
  awardFloor: number | null;
  closeDate: string | null;
  postDate: string | null;
  link: string;
  source: string;
  category: string | null;
}

// SBA SBIR/STTR programs — fetched from SBIR.gov public API
export async function searchSBIR(keyword: string): Promise<ExternalGrant[]> {
  try {
    const url = `https://api.sbir.gov/public/api/solicitations?keyword=${encodeURIComponent(keyword)}&rows=20&open=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json() as any;
    const items = data.docs || data.solrs || [];

    return items.map((s: any) => ({
      opportunityId: `sbir-${s.solicitation_id || s.program_id || Math.random().toString(36).slice(2)}`,
      title: s.solicitation_title || s.program_title || 'SBA Program',
      agency: s.agency || 'SBA/SBIR',
      description: s.program_description || s.synopsis || '',
      awardCeiling: s.award_ceiling ? parseInt(s.award_ceiling) : null,
      awardFloor: s.award_floor ? parseInt(s.award_floor) : null,
      closeDate: s.close_date || s.solicitation_close_date || null,
      postDate: s.open_date || null,
      link: s.solicitation_url || `https://www.sbir.gov/solicitations`,
      source: 'SBA/SBIR',
      category: 'Research & Development',
    }));
  } catch (err) {
    console.error('SBIR search error:', err);
    return [];
  }
}

// SBA 7(j) Management and Technical Assistance Program (for 8a/HUBZone/SDVOSB)
// SBA Microloan program info (static — no API, we surface these as evergreen opportunities)
export function getSBAEvergreenPrograms(ownershipType?: string): ExternalGrant[] {
  const programs: ExternalGrant[] = [
    {
      opportunityId: 'sba-microloan-evergreen',
      title: 'SBA Microloan Program',
      agency: 'U.S. Small Business Administration',
      description: 'Provides small, short-term loans to small business concerns and certain types of not-for-profit childcare centers. Loans up to $50,000 for working capital, inventory, supplies, furniture, and equipment.',
      awardCeiling: 50000,
      awardFloor: 500,
      closeDate: null,
      postDate: null,
      link: 'https://www.sba.gov/funding-programs/loans/microloans',
      source: 'SBA',
      category: 'Small Business Loans',
    },
    {
      opportunityId: 'sba-7a-evergreen',
      title: 'SBA 7(a) Loan Program',
      agency: 'U.S. Small Business Administration',
      description: 'The SBA\'s primary program for providing financial assistance to small businesses. Maximum loan amount of $5 million for working capital, machinery, equipment, furniture, renovation, and real estate.',
      awardCeiling: 5000000,
      awardFloor: null,
      closeDate: null,
      postDate: null,
      link: 'https://www.sba.gov/funding-programs/loans/7a-loans',
      source: 'SBA',
      category: 'Small Business Loans',
    },
  ];

  // Add ownership-specific programs
  if (ownershipType === 'minority' || ownershipType === '8a') {
    programs.push({
      opportunityId: 'sba-8a-evergreen',
      title: 'SBA 8(a) Business Development Program',
      agency: 'U.S. Small Business Administration',
      description: 'Offers a broad scope of assistance to firms that are owned and controlled at least 51% by socially and economically disadvantaged individuals. Includes mentorship, management assistance, and set-aside federal contracting.',
      awardCeiling: null,
      awardFloor: null,
      closeDate: null,
      postDate: null,
      link: 'https://www.sba.gov/federal-contracting/contracting-assistance-programs/8a-business-development-program',
      source: 'SBA',
      category: 'Certification Program',
    });
  }

  if (ownershipType === 'woman') {
    programs.push({
      opportunityId: 'sba-wosb-evergreen',
      title: 'Women-Owned Small Business (WOSB) Federal Contracting Program',
      agency: 'U.S. Small Business Administration',
      description: 'Helps women-owned small businesses compete for federal contracts in industries where WOSBs are underrepresented. Includes set-aside contracts and sole source awards.',
      awardCeiling: null,
      awardFloor: null,
      closeDate: null,
      postDate: null,
      link: 'https://www.sba.gov/federal-contracting/contracting-assistance-programs/women-owned-small-business-federal-contracting-program',
      source: 'SBA',
      category: 'Certification Program',
    });
  }

  if (ownershipType === 'veteran' || ownershipType === 'service-disabled-veteran') {
    programs.push({
      opportunityId: 'sba-vets-evergreen',
      title: 'Veteran Small Business Certification (VetCert)',
      agency: 'U.S. Small Business Administration',
      description: 'Certifies veteran-owned and service-disabled veteran-owned small businesses for set-aside federal contracting opportunities through the VA and other agencies.',
      awardCeiling: null,
      awardFloor: null,
      closeDate: null,
      postDate: null,
      link: 'https://www.sba.gov/federal-contracting/contracting-assistance-programs/veteran-contracting-assistance-programs',
      source: 'SBA',
      category: 'Certification Program',
    });
  }

  return programs;
}
