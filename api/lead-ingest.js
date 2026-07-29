// Serverless proxy: forwards website consultation leads to the internal ERP (경청 ERP).
// LEAD_INGEST_API_KEY lives only in Vercel Environment Variables and never reaches the browser.
const ERP_LEAD_ENDPOINT = process.env.LEAD_INGEST_ENDPOINT
    || 'https://erp-crm-ebon.vercel.app/api/integrations/leads';

function pickString(value) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, 500);
}

function generateExternalId() {
    return 'web-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const apiKey = process.env.LEAD_INGEST_API_KEY;
    if (!apiKey) {
        console.error('[lead-ingest] LEAD_INGEST_API_KEY 환경변수가 설정되지 않았습니다.');
        return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    let body = req.body;
    if (!body || typeof body !== 'object') {
        try {
            body = JSON.parse(body || '{}');
        } catch (err) {
            return res.status(400).json({ success: false, error: 'Invalid JSON body' });
        }
    }

    const companyName = pickString(body.company_name) || pickString(body.ceo_name);
    if (!companyName) {
        return res.status(400).json({ success: false, error: 'company_name is required' });
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
            return res.status(502).json({ success: false, error: 'Upstream error', status: upstream.status });
        }

        return res.status(200).json(data);
    } catch (err) {
        console.error('[lead-ingest] ERP 호출 실패:', err);
        return res.status(502).json({ success: false, error: 'Upstream request failed' });
    }
};
