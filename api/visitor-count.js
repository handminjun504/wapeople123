// Serverless: returns the site visitor counts (today / cumulative) from GA4.
//
// The GA4 service-account credential never reaches the browser — it lives only
// in Vercel Environment Variables. Required env:
//   GA4_PROPERTY_ID   numeric GA4 property id, e.g. 518729237
//   GA4_SA_KEY        service-account JSON (raw, or base64 of the file)
// Optional env:
//   GA4_TOTAL_START   first date for the cumulative tally (default 2020-01-01)
//   GA4_TODAY_METRIC  activeUsers (default) | sessions | screenPageViews
//
// GET /api/visitor-count
//   -> 200 { ok:true, today:N, total:M, metric, updatedAt }
//   -> 200 { ok:false, reason } when not configured or GA4 is unreachable —
//      the footer simply hides the counter instead of showing a broken value.
//
// Counts are edge-cached so a busy page does not hammer the GA4 Data API.

const crypto = require('crypto');

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const CACHE_SECONDS = Number(process.env.VISITOR_CACHE_SECONDS || '600');

function sendJson(res, status, body, cacheSeconds) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', cacheSeconds
        ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`
        : 'no-store');
    return res.status(status).json(body);
}

function parseServiceAccount(raw) {
    if (!raw) return null;
    const value = String(raw).trim();
    const candidates = [value];
    // Allow the whole JSON to be pasted base64-encoded (single env var, no newlines).
    try {
        candidates.push(Buffer.from(value, 'base64').toString('utf8'));
    } catch (err) { /* ignore */ }
    for (const candidate of candidates) {
        try {
            const parsed = JSON.parse(candidate);
            if (parsed && parsed.client_email && parsed.private_key) return parsed;
        } catch (err) { /* try next */ }
    }
    return null;
}

function base64url(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function buildAssertion(sa) {
    const iat = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64url(JSON.stringify({
        iss: sa.client_email,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat,
        exp: iat + 3600
    }));
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${header}.${payload}`);
    const signature = signer.sign(sa.private_key, 'base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return `${header}.${payload}.${signature}`;
}

async function getAccessToken(sa) {
    const body = new URLSearchParams();
    body.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    body.set('assertion', buildAssertion(sa));
    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`token ${response.status} ${text.slice(0, 200)}`);
    }
    const data = await response.json();
    if (!data.access_token) throw new Error('token response missing access_token');
    return data.access_token;
}

async function runReport(propertyId, token, startDate, endDate, metric) {
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            dateRanges: [{ startDate, endDate }],
            metrics: [{ name: metric }],
            limit: 1
        })
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`runReport ${response.status} ${text.slice(0, 200)}`);
    }
    const data = await response.json();
    if (!data.rows || !data.rows.length) return 0;
    const value = data.rows[0].metricValues && data.rows[0].metricValues[0];
    return value ? Number(value.value) || 0 : 0;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        return sendJson(res, 405, { ok: false, reason: 'method_not_allowed' }, 0);
    }

    const propertyId = String(process.env.GA4_PROPERTY_ID || '').trim();
    const sa = parseServiceAccount(process.env.GA4_SA_KEY || '');
    if (!propertyId || !sa) {
        // Not configured yet — keep the footer quiet, do not error for visitors.
        return sendJson(res, 200, { ok: false, reason: 'not_configured' }, 60);
    }

    const metric = String(process.env.GA4_TODAY_METRIC || 'activeUsers').trim() || 'activeUsers';
    const totalStart = String(process.env.GA4_TOTAL_START || '2020-01-01').trim();

    try {
        const token = await getAccessToken(sa);
        // GA4 omits empty date ranges, so ask for each window separately.
        const [today, total] = await Promise.all([
            runReport(propertyId, token, 'today', 'today', metric),
            runReport(propertyId, token, totalStart, 'today', metric)
        ]);
        return sendJson(res, 200, {
            ok: true,
            today,
            total,
            metric,
            updatedAt: new Date().toISOString()
        }, CACHE_SECONDS);
    } catch (err) {
        console.error('[visitor-count] GA4 조회 실패:', err && err.message ? err.message : err);
        return sendJson(res, 200, { ok: false, reason: 'upstream_error' }, 120);
    }
};
