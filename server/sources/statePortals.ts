// State grant portal integrations
// Each state uses a different approach — some have APIs, most require scraping or static knowledge

import type { ExternalGrant } from './sba.js';

// Known state-level grant programs by state code
// These are real, recurring programs — links updated as of 2025
const STATE_PROGRAMS: Record<string, ExternalGrant[]> = {
  FL: [
    {
      opportunityId: 'fl-eidl-quick-bridge',
      title: 'Florida Small Business Emergency Bridge Loan Program',
      agency: 'Florida Department of Economic Opportunity',
      description: 'Short-term, interest-free loans to help small businesses bridge the gap between the time a disaster impacts a business and when a business has secured longer-term recovery resources.',
      awardCeiling: 50000,
      awardFloor: 1000,
      closeDate: null,
      postDate: null,
      link: 'https://floridajobs.org/small-business-florida/business-finance/emergency-bridge-loan-program',
      source: 'Florida DEO',
      category: 'Emergency Loan',
    },
    {
      opportunityId: 'fl-innovation-fund',
      title: 'Florida Innovation Incentive Program',
      agency: 'Enterprise Florida',
      description: 'Supports high-value technology companies with significant job creation potential in Florida. Focuses on R&D, headquarters, and high-tech manufacturing.',
      awardCeiling: 2000000,
      awardFloor: 100000,
      closeDate: null,
      postDate: null,
      link: 'https://www.enterpriseflorida.com/find-funding',
      source: 'Enterprise Florida',
      category: 'Innovation / Technology',
    },
  ],
  TX: [
    {
      opportunityId: 'tx-enterprise-fund',
      title: 'Texas Enterprise Fund',
      agency: 'Office of the Governor of Texas',
      description: 'Serves as a deal-closing tool used to attract jobs and capital investment to Texas. Available to businesses creating significant numbers of jobs and making major capital investments.',
      awardCeiling: 10000000,
      awardFloor: 100000,
      closeDate: null,
      postDate: null,
      link: 'https://gov.texas.gov/business/page/texas-enterprise-fund',
      source: 'Texas Governor\'s Office',
      category: 'Economic Development',
    },
    {
      opportunityId: 'tx-rural-fund',
      title: 'Texas Capital Fund — Rural Business Development',
      agency: 'Texas Department of Agriculture',
      description: 'Assists small and medium-sized businesses in rural Texas with infrastructure, real estate, and equipment needs. Available to communities with populations under 50,000.',
      awardCeiling: 500000,
      awardFloor: 50000,
      closeDate: null,
      postDate: null,
      link: 'https://www.texasagriculture.gov/grants/rural-economic-development',
      source: 'Texas Department of Agriculture',
      category: 'Rural Development',
    },
  ],
  GA: [
    {
      opportunityId: 'ga-quick-start',
      title: 'Georgia Quick Start Program',
      agency: 'Technical College System of Georgia',
      description: 'Free customized workforce training for qualified new and expanding businesses in Georgia. One of the most successful economic development training programs in the US.',
      awardCeiling: null,
      awardFloor: null,
      closeDate: null,
      postDate: null,
      link: 'https://www.quickstart.org',
      source: 'Georgia TCSG',
      category: 'Workforce Training',
    },
  ],
  CA: [
    {
      opportunityId: 'ca-ibank-small-biz',
      title: 'California IBank Small Business Finance Center',
      agency: 'California IBank',
      description: 'Provides loan guarantees and direct loans to help small businesses access capital. Includes the Small Business Loan Guarantee Program and Disaster Relief Loan Guarantee Program.',
      awardCeiling: 1000000,
      awardFloor: 5000,
      closeDate: null,
      postDate: null,
      link: 'https://ibank.ca.gov/small-business',
      source: 'California IBank',
      category: 'Loan Guarantee',
    },
    {
      opportunityId: 'ca-go-biz-grants',
      title: 'California Small Business Grant Program',
      agency: 'California Office of the Small Business Advocate',
      description: 'Provides grants to small businesses and nonprofits affected by disruptions. Targets underrepresented small business owners in communities with the greatest need.',
      awardCeiling: 25000,
      awardFloor: 5000,
      closeDate: null,
      postDate: null,
      link: 'https://calosba.ca.gov',
      source: 'California OSBA',
      category: 'Small Business Grant',
    },
  ],
  NY: [
    {
      opportunityId: 'ny-excelsior',
      title: 'Excelsior Jobs Program',
      agency: 'Empire State Development',
      description: 'Provides job creation and investment incentives to firms in targeted industries including transportation, advanced manufacturing, software, and biotechnology.',
      awardCeiling: 500000,
      awardFloor: null,
      closeDate: null,
      postDate: null,
      link: 'https://esd.ny.gov/excelsior-jobs-program',
      source: 'Empire State Development',
      category: 'Job Creation Incentive',
    },
  ],
  IL: [
    {
      opportunityId: 'il-edge-tax-credit',
      title: 'EDGE Tax Credit Program (Illinois)',
      agency: 'Illinois Department of Commerce and Economic Opportunity',
      description: 'Tax credit for businesses that retain or create jobs in Illinois. Available for companies creating at least 10 new full-time jobs or maintaining 90% of current workforce.',
      awardCeiling: null,
      awardFloor: null,
      closeDate: null,
      postDate: null,
      link: 'https://dceo.illinois.gov/smallbizassistance/businessfinance.html',
      source: 'Illinois DCEO',
      category: 'Tax Credit',
    },
  ],
  OH: [
    {
      opportunityId: 'oh-development-grants',
      title: 'Ohio Small Business Development Grants',
      agency: 'Ohio Development Services Agency',
      description: 'Grants to small businesses for job creation and retention in Ohio. Prioritizes businesses in distressed communities and those owned by underrepresented groups.',
      awardCeiling: 100000,
      awardFloor: 10000,
      closeDate: null,
      postDate: null,
      link: 'https://development.ohio.gov/business/grants',
      source: 'Ohio DSA',
      category: 'Small Business Grant',
    },
  ],
};

// Federal DOT programs relevant to trucking/transportation
const TRANSPORTATION_PROGRAMS: ExternalGrant[] = [
  {
    opportunityId: 'dot-disadvantaged-business',
    title: 'DOT Disadvantaged Business Enterprise (DBE) Program',
    agency: 'U.S. Department of Transportation',
    description: 'Ensures that small businesses owned by socially and economically disadvantaged individuals can compete for DOT-assisted contracts. Provides certification and set-aside contracting opportunities on federally funded transportation projects.',
    awardCeiling: null,
    awardFloor: null,
    closeDate: null,
    postDate: null,
    link: 'https://www.transportation.gov/civil-rights/disadvantaged-business-enterprise',
    source: 'U.S. DOT',
    category: 'Federal Contracting',
  },
  {
    opportunityId: 'fmcsa-safety-grants',
    title: 'FMCSA Motor Carrier Safety Assistance Program (MCSAP)',
    agency: 'Federal Motor Carrier Safety Administration',
    description: 'Federal grants to support state programs that reduce commercial motor vehicle crashes, injuries, and fatalities. States use funds for inspections, enforcement, and outreach to motor carriers.',
    awardCeiling: null,
    awardFloor: null,
    closeDate: null,
    postDate: null,
    link: 'https://www.fmcsa.dot.gov/safety/mcsap',
    source: 'FMCSA',
    category: 'Transportation Safety',
  },
];

export function getStatePrograms(state: string, naicsCodes: string[]): ExternalGrant[] {
  const stateGrants = STATE_PROGRAMS[state] || [];
  const hasTransportation = naicsCodes.some(c => c.startsWith('484') || c.startsWith('488'));
  const transportationGrants = hasTransportation ? TRANSPORTATION_PROGRAMS : [];
  return [...stateGrants, ...transportationGrants];
}

export function getAllStateProgramStates(): string[] {
  return Object.keys(STATE_PROGRAMS);
}
