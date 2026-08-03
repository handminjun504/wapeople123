// Serverless proxy: forwards website consultation leads to the internal ERP (경청 ERP).
// LEAD_INGEST_API_KEY lives only in Vercel Environment Variables and never reaches the browser.
//
// Logging:
// - Every request emits a structured [lead-ingest-audit] JSON line (success + failure)
// - Upstream failures keep: console.error('[lead-ingest] ERP 응답 오류:', status, body)
// - Optional LEAD_INGEST_AUDIT_URL receives the same audit JSON for 7~30+ day retention
const ERP_LEAD_ENDPOINT = process.env.LEAD_INGEST_ENDPOINT
    || 'https://erp-crm-ebon.vercel.app/api/integrations/leads';
const AUDIT_URL = process.env.LEAD_INGEST_AUDIT_URL || '';
const BODY_LOG_LIMIT = 2000;

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

    // Optional durable sink (Sheet webhook / Axiom / custom collector) for 7~30+ day retention.
    if (!AUDIT_URL) return Promise.resolve();
    return fetch(AUDIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: line
    }).catch(function (err) {
        console.error('[lead-ingest] audit sink 실패:', err && err.message ? err.message : err);
    });
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

    const payload = {
        external_id: pickString(body.external_id) || generateExternalId(),
        company_name: companyName,
        ceo_name: pickString(body.ceo_name),
        phone: pickString(body.phone),
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

    const safeMeta = {
        external_id: payload.external_id,
        company_name: payload.company_name,
        ceo_name: payload.ceo_name || '',
        phone: maskPhone(payload.phone),
        email: maskEmail(payload.email),
        channel: payload.channel || 'website',
        source: payload.source || 'website'
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
            // Keep existing failure log format for ops/search compatibility.
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
