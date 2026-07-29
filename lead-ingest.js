/* Forwards consultation form submissions to the internal ERP lead API via /api/lead-ingest.
   Fire-and-forget: failures are swallowed so the existing Google Sheet/email flow never breaks. */
(function () {
    'use strict';

    function fieldValue(form, name) {
        var el = form.querySelector('[name="' + name + '"]');
        if (!el) return '';
        return (el.value || '').trim();
    }

    function checkedValues(form, name) {
        var els = form.querySelectorAll('input[name="' + name + '"]:checked');
        return Array.prototype.map.call(els, function (el) { return el.value; }).join(', ');
    }

    function pageSlug() {
        var path = window.location.pathname.replace(/^\/+/, '').replace(/\.html$/, '');
        return path || 'home';
    }

    function buildMemo(form) {
        var parts = [];
        var concerns = checkedValues(form, 'concerns');
        if (concerns) parts.push('고민: ' + concerns);
        var message = fieldValue(form, 'message');
        if (message) parts.push('문의내용: ' + message);
        var referral = fieldValue(form, 'referral_source');
        if (referral) parts.push('유입경로: ' + referral);
        parts.push('페이지: /' + pageSlug());
        return parts.join(' / ');
    }

    window.wapeopleSendLeadToErp = function (form) {
        try {
            if (!form || form.tagName !== 'FORM') return;

            var concern = checkedValues(form, 'concerns') || fieldValue(form, 'message');
            var payload = {
                external_id: 'web-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10),
                company_name: fieldValue(form, 'company') || fieldValue(form, 'name'),
                ceo_name: fieldValue(form, 'name'),
                phone: fieldValue(form, 'phone'),
                email: fieldValue(form, 'email'),
                industry_or_channel: fieldValue(form, 'industry'),
                employee_count: fieldValue(form, 'employees'),
                concern: concern,
                memo: buildMemo(form),
                channel: 'website',
                source: 'website:' + pageSlug()
            };

            if (!payload.company_name) return;

            fetch('/api/lead-ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(function (err) {
                console.warn('ERP 리드 전송 실패(무시됨):', err);
            });
        } catch (err) {
            console.warn('ERP 리드 전송 준비 실패(무시됨):', err);
        }
    };
})();
