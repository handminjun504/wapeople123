// Serverless proxy: forwards website consultation leads to the internal ERP (경청 ERP).
// LEAD_INGEST_API_KEY / RECAPTCHA_SECRET_KEY live only in Vercel Environment Variables.
//
// Bot protection:
// - Requires reCAPTCHA v3 token (action: lead_ingest), verified server-side
// - Origin/Referer allowlist for wapeople.kr (+ preview/localhost)
// - Honeypot field `website_url` must be empty
//
// Logging:
// - Every request emits a structured [lead-ingest-audit] JSON line (success + failure)
// - Upstream failures keep: console.error('[lead-ingest] ERP 응답 오류:', status, body)
// - Optional LEAD_INGEST_AUDIT_URL receives the same audit JSON for 7~30+ day retention
const ERP_LEAD_ENDPOINT = process.env.LEAD_INGEST_ENDPOINT
    || 'https://erp-crm-ebon.vercel.app/api/integrations/leads';
const AUDIT_URL = process.env.LEAD_INGEST_AUDIT_URL || '';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || '';
const RECAPTCHA_MIN_SCORE = Number(process.env.RECAPTCHA_MIN_SCORE || '0.5');
const RECAPTCHA_EXPECTED_ACTION = 'lead_ingest';
const BODY_LOG_LIMIT = 2000;

const ALLOWED_HOST_SUFFIXES = [
    'wapeople.kr',
    'localhost',
    '127.0.0.1'
];

function pickString(value) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, 500);
}

function generateExternalId() {
    return 'web-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

function generateRequestId() {
    return 'li-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

function truncate(text, limit) {
    const value = String(text == null ? '' : text);
    if (value.length <= limit) return value;
    return value.slice(0, limit) + '…(truncated)';
}

function maskPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length < 7) return phone || '';
    return digits.slice(0, 3) + '-****-' + digits.slice(-4);
}

function maskEmail(email) {
    const value = String(email || '');
    const at = value.indexOf('@');
    if (at < 1) return value ? '***' : '';
    return value[0] + '***' + value.slice(at);
}

function hostAllowed(hostname) {
    if (!hostname) return false;
    const host = String(hostname).toLowerCase().replace(/:\d+$/, '');
    if (host.endsWith('.vercel.app')) return true;
    return ALLOWED_HOST_SUFFIXES.some(function (suffix) {
        return host === suffix || host.endsWith('.' + suffix);
    });
}

function isAllowedOrigin(req) {
    const origin = pickString(req.headers.origin || '');
    const referer = pickString(req.headers.referer || req.headers.referrer || '');

    if (origin) {
        try {
            return hostAllowed(new URL(origin).hostname);
        } catch (err) {
            return false;
        }
    }

    if (referer) {
        try {
            return hostAllowed(new URL(referer).hostname);
        } catch (err) {
            return false;
        }
    }

    // Server-to-server / curl without Origin: reject (browser form always sends one of these).
    return false;
}

function looksLikePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 15;
}

async function verifyRecaptcha(token, remoteip) {
    if (!RECAPTCHA_SECRET) {
        return { ok: false, reason: 'missing_secret' };
    }
    if (!token) {
        return { ok: false, reason: 'missing_token' };
    }

    const params = new URLSearchParams();
    params.set('secret', RECAPTCHA_SECRET);
    params.set('response', token);
    if (remoteip) params.set('remoteip', remoteip);

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    const data = await response.json().catch(function () { return {}; });
    if (!data.success) {
        return {
            ok: false,
            reason: 'verify_failed',
            errorCodes: data['error-codes'] || [],
            score: typeof data.score === 'number' ? data.score : null,
            action: data.action || null
        };
    }

    if (data.action && data.action !== RECAPTCHA_EXPECTED_ACTION) {
        return {
            ok: false,
            reason: 'action_mismatch',
            score: data.score,
            action: data.action
        };
    }

    const score = typeof data.score === 'number' ? data.score : 0;
    if (score < RECAPTCHA_MIN_SCORE) {
        return {
            ok: false,
            reason: 'low_score',
            score: score,
            action: data.action || null
        };
    }

    return {
        ok: true,
        score: score,
        action: data.action || null,
        hostname: data.hostname || null
    };
}

function buildAudit(base) {
    return {
        tag: 'lead-ingest-audit',
        ts: new Date().toISOString(),
        path: '/api/lead-ingest',
        endpoint: ERP_LEAD_ENDPOINT,
        ...base
    };
}

function logAudit(entry) {
    const line = JSON.stringify(entry);
    if (entry.ok) {
        console.log(line);
    } else {
        console.error(line);
    }

    if (!AUDIT_URL) return Promise.resolve();
    return fetch(AUDIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: line
    }).catch(function (err) {
        console.error('[lead-ingest] audit sink 실패:', err && err.message ? err.message : err);
    });
}

function clientIp(req) {
    const forwarded = pickString(req.headers['x-forwarded-for'] || '');
    if (forwarded) return forwarded.split(',')[0].trim();
    return pickString(req.headers['x-real-ip'] || '') || undefined;
}

module.exports = async function handler(req, res) {
    const requestId = generateRequestId();
    res.setHeader('x-lead-ingest-request-id', requestId);

    if (req.method !== 'POST') {
        const audit = buildAudit({
            requestId,
            ok: false,
            stage: 'method',
            httpStatus: 405,
            method: req.method
        });
        await logAudit(audit);
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method Not Allowed', requestId });
    }

    if (!isAllowedOrigin(req)) {
        const audit = buildAudit({
            requestId,
            ok: false,
            stage: 'origin',
            httpStatus: 403,
            error: 'Forbidden origin',
            origin: pickString(req.headers.origin || ''),
            referer: pickString(req.headers.referer || '')
        });
        await logAudit(audit);
        return res.status(403).json({ success: false, error: 'Forbidden', requestId });
    }

    const apiKey = process.env.LEAD_INGEST_API_KEY;
    if (!apiKey) {
        console.error('[lead-ingest] LEAD_INGEST_API_KEY 환경변수가 설정되지 않았습니다.');
        const audit = buildAudit({
            requestId,
            ok: false,
            stage: 'config',
            httpStatus: 500,
            error: 'Server not configured'
        });
        await logAudit(audit);
        return res.status(500).json({ success: false, error: 'Server not configured', requestId });
    }

    if (!RECAPTCHA_SECRET) {
        console.error('[lead-ingest] RECAPTCHA_SECRET_KEY 환경변수가 설정되지 않았습니다.');
        const audit = buildAudit({
            requestId,
            ok: false,
            stage: 'config',
            httpStatus: 500,
            error: 'reCAPTCHA not configured'
        });
        await logAudit(audit);
        return res.status(500).json({ success: false, error: 'Server not configured', requestId });
    }

    let body = req.body;
    if (!body || typeof body !== 'object') {
        try {
            body = JSON.parse(body || '{}');
        } catch (err) {
            const audit = buildAudit({
                requestId,
                ok: false,
                stage: 'parse',
                httpStatus: 400,
                error: 'Invalid JSON body'
            });
            await logAudit(audit);
            return res.status(400).json({ success: false, error: 'Invalid JSON body', requestId });
        }
    }

    // Honeypot: real users never fill this (hidden/offscreen field).
    if (pickString(body.website_url) || pickString(body.hp_website)) {
        const audit = buildAudit({
            requestId,
            ok: false,
            stage: 'honeypot',
            httpStatus: 204,
            error: 'honeypot_triggered'
        });
        await logAudit(audit);
        // Fake success so bots don't retry smarter.
        return res.status(200).json({ success: true, created: false, ignored: true, requestId });
    }

    const companyName = pickString(body.company_name) || pickString(body.ceo_name);
    if (!companyName) {
        const audit = buildAudit({
            requestId,
            ok: false,
            stage: 'validate',
            httpStatus: 400,
            error: 'company_name is required'
        });
        await logAudit(audit);
        return res.status(400).json({ success: false, error: 'company_name is required', requestId });
    }

    const phone = pickString(body.phone);
    if (!looksLikePhone(phone)) {
        const audit = buildAudit({
            requestId,
            ok: false,
            stage: 'validate',
            httpStatus: 400,
            error: 'phone is required'
        });
        await logAudit(audit);
        return res.status(400).json({ success: false, error: 'phone is required', requestId });
    }

    let captcha;
    try {
        captcha = await verifyRecaptcha(pickString(body.recaptcha_token), clientIp(req));
    } catch (err) {
        console.error('[lead-ingest] reCAPTCHA 검증 호출 실패:', err);
        const audit = buildAudit({
            requestId,
            ok: false,
            stage: 'recaptcha',
            httpStatus: 502,
            error: 'recaptcha_verify_error'
        });
        await logAudit(audit);
        return res.status(502).json({ success: false, error: 'Bot check failed', requestId });
    }

    if (!captcha.ok) {
        const audit = buildAudit({
            requestId,
            ok: false,
            stage: 'recaptcha',
            httpStatus: 403,
            error: captcha.reason,
            score: captcha.score,
            action: captcha.action,
            errorCodes: captcha.errorCodes || null
        });
        await logAudit(audit);
        return res.status(403).json({ success: false, error: 'Bot check failed', requestId });
    }

    const payload = {
        external_id: pickString(body.external_id) || generateExternalId(),
        company_name: companyName,
        ceo_name: pickString(body.ceo_name),
        phone: phone,
        email: pickString(body.email),
        channel: pickString(body.channel) || 'website',
        industry_or_channel: pickString(body.industry_or_channel),
        employee_count: pickString(body.employee_count),
        concern: pickString(body.concern),
        memo: pickString(body.memo),
        source: pickString(body.source) || 'website'
    };

    Object.keys(payload).forEach((key) => {
        if (!payload[key]) delete payload[key];
    });
    payload.external_id = payload.external_id || generateExternalId();
    payload.company_name = companyName;
    payload.phone = phone;

    const safeMeta = {
        external_id: payload.external_id,
        company_name: payload.company_name,
        ceo_name: payload.ceo_name || '',
        phone: maskPhone(payload.phone),
        email: maskEmail(payload.email),
        channel: payload.channel || 'website',
        source: payload.source || 'website',
        recaptcha_score: captcha.score
    };

    try {
        const upstream = await fetch(ERP_LEAD_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const rawText = await upstream.text();
        let data;
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch (err) {
            data = { raw: rawText };
        }

        if (!upstream.ok) {
            console.error('[lead-ingest] ERP 응답 오류:', upstream.status, rawText);
            const audit = buildAudit({
                requestId,
                ok: false,
                stage: 'upstream',
                httpStatus: 502,
                upstreamStatus: upstream.status,
                upstreamBody: truncate(rawText, BODY_LOG_LIMIT),
                ...safeMeta
            });
            await logAudit(audit);
            return res.status(502).json({
                success: false,
                error: 'Upstream error',
                status: upstream.status,
                requestId
            });
        }

        const audit = buildAudit({
            requestId,
            ok: true,
            stage: 'success',
            httpStatus: 200,
            upstreamStatus: upstream.status,
            created: data && typeof data.created !== 'undefined' ? data.created : null,
            leadId: data && data.leadId ? data.leadId : null,
            leadCode: data && data.leadCode ? data.leadCode : null,
            upstreamBody: truncate(rawText, BODY_LOG_LIMIT),
            ...safeMeta
        });
        await logAudit(audit);

        return res.status(200).json(Object.assign({}, data, { requestId }));
    } catch (err) {
        console.error('[lead-ingest] ERP 호출 실패:', err);
        const audit = buildAudit({
            requestId,
            ok: false,
            stage: 'network',
            httpStatus: 502,
            error: err && err.message ? err.message : 'Upstream request failed',
            ...safeMeta
        });
        await logAudit(audit);
        return res.status(502).json({ success: false, error: 'Upstream request failed', requestId });
    }
};
