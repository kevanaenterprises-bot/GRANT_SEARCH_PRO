import { Router } from 'express';
import { db } from '../db.js';
import { businessProfiles } from '../schema.js';
import { eq } from 'drizzle-orm';

export const samRouter = Router();

const API_KEY = process.env.SAM_GOV_API_KEY;
const BASE = 'https://api.sam.gov';

function samHeaders() {
  return { 'Accept': 'application/json', 'X-Api-Key': API_KEY || '' };
}

// Normalize the entity response into something clean
function normalizeEntity(entity: any) {
  const core = entity.entityRegistration || {};
  const assertions = entity.assertions || {};
  const reps = entity.repsAndCerts || {};
  const addresses = entity.coreData?.mailingAddress || entity.coreData?.physicalAddress || {};
  const naicsArr: any[] = assertions.goodsAndServices?.naicsList || [];

  return {
    uei: core.ueiSAM,
    cageCode: core.cageCode,
    legalName: core.legalBusinessName,
    dbaName: core.dbaName,
    registrationStatus: core.registrationStatus, // 'Active' | 'Inactive' | 'Expired'
    registrationDate: core.registrationDate,
    expirationDate: core.expirationDate,
    lastUpdated: core.lastUpdateDate,
    entityType: core.entityType,
    organizationStructure: core.organizationStructure,
    stateOfIncorporation: core.stateOfIncorporationCode,
    countryOfIncorporation: core.countryOfIncorporationCode,
    address: {
      street: addresses.streetAddress,
      city: addresses.city,
      state: addresses.stateOrProvinceCode,
      zip: addresses.zipCode,
      country: addresses.countryCode,
    },
    naicsCodes: naicsArr.map((n: any) => ({
      code: n.naicsCode,
      isPrimary: n.isPrimary === 'Y',
      isSmallBusiness: n.sbaSmallBusiness === 'Y',
      label: n.naicsDescription,
    })),
    smallBusinessDesignations: {
      sba8a: reps.certifications?.sba8aCertification?.certificationEntryDate ? true : false,
      hubzone: reps.certifications?.hubZoneCertification?.certificationEntryDate ? true : false,
      wosb: reps.certifications?.wosbCertification?.certificationEntryDate ? true : false,
      edwosb: reps.certifications?.edwosbCertification?.certificationEntryDate ? true : false,
      veteranOwned: core.veteranOwnedBusiness === 'Yes',
      serviceDisabledVeteran: core.sbaVeteranOwnedSmallBusiness === 'Yes',
    },
    purposeOfRegistration: core.purposeOfRegistrationDesc,
  };
}

// Look up entity by UEI
samRouter.get('/entity/:uei', async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: 'SAM_GOV_API_KEY not configured' });

  try {
    const url = `${BASE}/entity-information/v3/entities?ueiSAM=${req.params.uei}&includeSections=entityRegistration,assertions,repsAndCerts,coreData&api_key=${API_KEY}`;
    const response = await fetch(url, { headers: samHeaders() });

    if (response.status === 404) return res.status(404).json({ error: 'Entity not found in SAM.gov' });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SAM.gov API error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json() as any;
    const entities = data.entityData || [];
    if (!entities.length) return res.status(404).json({ error: 'No entity found for that UEI' });

    res.json(normalizeEntity(entities[0]));
  } catch (err: any) {
    console.error('SAM entity lookup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check exclusions (debarment) by UEI
samRouter.get('/exclusions/:uei', async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: 'SAM_GOV_API_KEY not configured' });

  try {
    const url = `${BASE}/exclusions/v1/exclusions?ueiSAM=${req.params.uei}&api_key=${API_KEY}`;
    const response = await fetch(url, { headers: samHeaders() });

    if (!response.ok) throw new Error(`SAM.gov exclusions API error: ${response.status}`);

    const data = await response.json() as any;
    const exclusions = data.exclusionData || [];

    res.json({
      uei: req.params.uei,
      isExcluded: exclusions.length > 0,
      exclusions: exclusions.map((e: any) => ({
        name: e.exclusionName,
        type: e.exclusionType,
        agency: e.agencyName,
        startDate: e.activationDate,
        endDate: e.terminationDate,
        cause: e.exclusionProgram,
      })),
    });
  } catch (err: any) {
    console.error('SAM exclusions check error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Full status check: entity + exclusions combined
samRouter.get('/status/:uei', async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: 'SAM_GOV_API_KEY not configured' });

  try {
    const [entityRes, exclusionsRes] = await Promise.allSettled([
      fetch(`${BASE}/entity-information/v3/entities?ueiSAM=${req.params.uei}&includeSections=entityRegistration,assertions,repsAndCerts,coreData&api_key=${API_KEY}`, { headers: samHeaders() }),
      fetch(`${BASE}/exclusions/v1/exclusions?ueiSAM=${req.params.uei}&api_key=${API_KEY}`, { headers: samHeaders() }),
    ]);

    let entity = null;
    if (entityRes.status === 'fulfilled' && entityRes.value.ok) {
      const data = await entityRes.value.json() as any;
      const entities = data.entityData || [];
      if (entities.length) entity = normalizeEntity(entities[0]);
    }

    let exclusions: any[] = [];
    let isExcluded = false;
    if (exclusionsRes.status === 'fulfilled' && exclusionsRes.value.ok) {
      const data = await exclusionsRes.value.json() as any;
      exclusions = data.exclusionData || [];
      isExcluded = exclusions.length > 0;
    }

    const isActive = entity?.registrationStatus === 'Active';
    const expiresAt = entity?.expirationDate;
    const daysUntilExpiry = expiresAt
      ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
      : null;

    res.json({
      uei: req.params.uei,
      found: !!entity,
      entity,
      isActive,
      isExcluded,
      exclusionCount: exclusions.length,
      daysUntilExpiry,
      expiringWithin30Days: daysUntilExpiry != null && daysUntilExpiry <= 30 && daysUntilExpiry > 0,
      summary: !entity
        ? 'Not found in SAM.gov'
        : isExcluded
        ? '⛔ EXCLUDED — debarred from federal contracts/grants'
        : !isActive
        ? '⚠️ Registration inactive or expired — must renew to receive awards'
        : daysUntilExpiry != null && daysUntilExpiry <= 30
        ? `⚠️ Registration expires in ${daysUntilExpiry} days — renew now`
        : '✅ Active and eligible',
    });
  } catch (err: any) {
    console.error('SAM status check error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Search SAM.gov contract opportunities
samRouter.post('/opportunities', async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: 'SAM_GOV_API_KEY not configured' });

  try {
    const { keyword, naicsCodes, state, limit = 20, postedFrom, postedTo } = req.body;

    const params = new URLSearchParams({
      api_key: API_KEY,
      limit: String(limit),
      offset: '0',
    });

    if (keyword) params.set('keyword', keyword);
    if (naicsCodes?.length) params.set('naicsCode', naicsCodes.join(','));
    if (state) params.set('placeOfPerformanceState', state);
    if (postedFrom) params.set('postedFrom', postedFrom);
    if (postedTo) params.set('postedTo', postedTo);

    const url = `${BASE}/opportunities/v2/search?${params}`;
    const response = await fetch(url, { headers: samHeaders() });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SAM.gov opportunities API error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json() as any;
    const opps = data.opportunitiesData || [];

    const normalized = opps.map((o: any) => ({
      noticeId: o.noticeId,
      title: o.title,
      solicitationNumber: o.solicitationNumber,
      agency: o.fullParentPathName || o.organizationHierarchy?.[0]?.name,
      type: o.type, // 'Presolicitation' | 'Combined Synopsis/Solicitation' | 'Sources Sought' etc.
      naicsCode: o.naicsCode,
      placeOfPerformance: o.placeOfPerformance,
      postedDate: o.postedDate,
      responseDeadline: o.responseDeadLine,
      archiveDate: o.archiveDate,
      setAside: o.typeOfSetAside,
      setAsideDescription: o.typeOfSetAsideDescription,
      link: o.uiLink || `https://sam.gov/opp/${o.noticeId}`,
      description: o.description?.slice(0, 500),
      awardCeiling: o.award?.amount ? parseFloat(o.award.amount) : null,
      source: 'SAM.gov',
    }));

    res.json({ opportunities: normalized, total: data.totalRecords || normalized.length });
  } catch (err: any) {
    console.error('SAM opportunities search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update profile UEI
samRouter.post('/profile/:id/set-uei', async (req, res) => {
  try {
    const { uei } = req.body;
    const [updated] = await db.update(businessProfiles)
      .set({ uei: uei?.trim().toUpperCase() })
      .where(eq(businessProfiles.id, parseInt(req.params.id)))
      .returning();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
