/* Forwards consultation form submissions to the internal ERP lead API via /api/lead-ingest.
   Fire-and-forget: failures are swallowed so the existing Google Sheet/email flow never breaks.
   Uses a dedicated reCAPTCHA v3 action (`lead_ingest`) so it does not collide with the form's
   `submit` token that may already be consumed by Google Apps Script. */
(function () {
    'use strict';

    var RECAPTCHA_SITE_KEY = '6Le0CEMsAAAAAFGF3Dnci1_SUkC4VWmzqdox2jJZ';
    var RECAPTCHA_ACTION = 'lead_ingest';
    var HONEYPOT_NAME = 'website_url';

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

    function ensureHoneypot(form) {
        var existing = form.querySelector('input[name="' + HONEYPOT_NAME + '"]');
        if (existing) return existing;

        var wrap = document.createElement('div');
        wrap.setAttribute('aria-hidden', 'true');
        wrap.style.cssText = 'position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;';

        var input = document.createElement('input');
        input.type = 'text';
        input.name = HONEYPOT_NAME;
        input.value = '';
        input.tabIndex = -1;
        input.autocomplete = 'off';

        wrap.appendChild(input);
        form.appendChild(wrap);
        return input;
    }

    function injectHoneypots() {
        var forms = document.querySelectorAll('form');
        for (var i = 0; i < forms.length; i++) {
            ensureHoneypot(forms[i]);
        }
    }

    function getRecaptchaToken() {
        return new Promise(function (resolve) {
            if (typeof grecaptcha === 'undefined' || typeof grecaptcha.execute !== 'function') {
                resolve('');
                return;
            }
            try {
                grecaptcha.ready(function () {
                    grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: RECAPTCHA_ACTION })
                        .then(function (token) { resolve(token || ''); })
                        .catch(function () { resolve(''); });
                });
            } catch (err) {
                resolve('');
            }
        });
    }

    function postLead(payload) {
        fetch('/api/lead-ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(function (err) {
            console.warn('ERP 리드 전송 실패(무시됨):', err);
        });
    }

    window.wapeopleSendLeadToErp = function (form) {
        try {
            if (!form || form.tagName !== 'FORM') return;

            ensureHoneypot(form);

            // Bot filled honeypot → still "send" so UX looks normal, server ignores.
            var honeypot = fieldValue(form, HONEYPOT_NAME);
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
                source: 'website:' + pageSlug(),
                website_url: honeypot
            };

            if (!payload.company_name) return;

            getRecaptchaToken().then(function (token) {
                payload.recaptcha_token = token;
                postLead(payload);
            });
        } catch (err) {
            console.warn('ERP 리드 전송 준비 실패(무시됨):', err);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectHoneypots);
    } else {
        injectHoneypots();
    }
})();
