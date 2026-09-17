const pool = require('../config/db');

let companyCache = null;
let lastCacheTime = 0;

async function getCompanyCache() {
  const now = Date.now();
  if (!companyCache || now - lastCacheTime > 30000) {
    try {
      const [rows] = await pool.execute('SELECT id, slug FROM companies');
      const slugToId = {};
      const idToSlug = {};
      for (const r of rows) {
        slugToId[String(r.slug).toLowerCase()] = r.id;
        slugToId[String(r.id)] = r.id;
        idToSlug[r.id] = r.slug;
      }
      companyCache = { slugToId, idToSlug };
      lastCacheTime = now;
    } catch (e) {
      console.warn('Company cache load warning:', e.message);
    }
  }
  return companyCache;
}

const companyScopeMiddleware = async (req, res, next) => {
  try {
    const queryComp = req.query?.company_id || req.query?.companyId;
    const headerComp = req.headers['x-company-id'];
    const bodyComp = req.body?.company_id || req.body?.companyId;
    const rawComp = queryComp !== undefined ? queryComp : (headerComp || bodyComp);

    if (rawComp && rawComp !== 'all') {
      const cache = await getCompanyCache();
      if (cache && cache.slugToId) {
        const resolvedId = cache.slugToId[String(rawComp).toLowerCase().trim()];
        if (resolvedId) {
          req.companyId = resolvedId;
          req.companySlug = cache.idToSlug[resolvedId] || String(rawComp);
          req.headers['x-company-id'] = String(resolvedId);
        }
      }
    } else if (rawComp === 'all') {
      req.companyId = 'all';
      req.companySlug = 'all';
    }

    const rawBranch = req.headers['x-branch-id'] || req.query?.branch_id || req.query?.branchId || req.body?.branch_id || req.body?.branchId;
    if (rawBranch && rawBranch !== 'all') {
      const numB = parseInt(rawBranch, 10);
      req.branchId = !isNaN(numB) ? numB : rawBranch;
    }

    const rawSubBranch = req.headers['x-sub-branch-id'] || req.query?.sub_branch_id || req.query?.subBranchId || req.body?.sub_branch_id || req.body?.subBranchId;
    if (rawSubBranch && rawSubBranch !== 'all') {
      const numSB = parseInt(rawSubBranch, 10);
      req.subBranchId = !isNaN(numSB) ? numSB : rawSubBranch;
    }
  } catch (err) {
    // Non-blocking
  }
  next();
};

function invalidateCompanyCache() {
  companyCache = null;
  lastCacheTime = 0;
}

companyScopeMiddleware.invalidateCompanyCache = invalidateCompanyCache;
module.exports = companyScopeMiddleware;
module.exports.invalidateCompanyCache = invalidateCompanyCache;
