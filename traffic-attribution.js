/* Traffic attribution helper for UTM/referrer tracking and form submissions */
(function () {
    'use strict';

    var STORAGE_KEY = 'wapeople_attribution_v1';
    var QUERY_KEYS = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'gclid',
        'fbclid',
        'ttclid',
        'msclkid',
        'igshid'
    ];

    function safeParse(value) {
        if (!value) return {};
        try {
            var parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function readQueryAttribution() {
        var params = new URLSearchParams(window.location.search);
        var data = {};

        QUERY_KEYS.forEach(function (key) {
            var value = params.get(key);
            if (value) data[key] = value;
        });

        return data;
    }

    function inferFromReferrer(referrer) {
        if (!referrer) return { source: 'direct', medium: 'none' };

        var host = '';
        try {
            host = new URL(referrer).hostname.toLowerCase();
        } catch (error) {
            return { source: 'referral', medium: 'referral' };
        }

        if (host.indexOf('instagram.com') > -1) return { source: 'instagram', medium: 'social' };
        if (host.indexOf('threads.net') > -1) return { source: 'threads', medium: 'social' };
        if (host.indexOf('blog.naver.com') > -1) return { source: 'naver_blog', medium: 'social' };
        if (host.indexOf('naver.com') > -1) return { source: 'naver', medium: 'organic' };
        if (host.indexOf('facebook.com') > -1 || host.indexOf('fb.com') > -1) return { source: 'facebook', medium: 'social' };
        if (host.indexOf('t.co') > -1 || host.indexOf('x.com') > -1 || host.indexOf('twitter.com') > -1) return { source: 'x', medium: 'social' };
        if (host.indexOf('youtube.com') > -1 || host.indexOf('youtu.be') > -1) return { source: 'youtube', medium: 'social' };
        if (host.indexOf('google.') > -1) return { source: 'google', medium: 'organic' };
        if (host.indexOf('bing.com') > -1) return { source: 'bing', medium: 'organic' };
        if (host.indexOf('daum.net') > -1) return { source: 'daum', medium: 'organic' };

        return { source: host || 'referral', medium: 'referral' };
    }

    function hasUtm(data) {
        return Boolean(data.utm_source || data.utm_medium || data.utm_campaign || data.utm_content || data.utm_term);
    }

    function buildAttribution() {
        var saved = safeParse(localStorage.getItem(STORAGE_KEY));
        var incoming = readQueryAttribution();
        var referrer = document.referrer || '';
        var inferred = inferFromReferrer(referrer);
        var timestamp = nowIso();

        var latestSource = incoming.utm_source || saved.latest_source || inferred.source || 'direct';
        var latestMedium = incoming.utm_medium || saved.latest_medium || inferred.medium || 'none';
        var latestCampaign = incoming.utm_campaign || saved.latest_campaign || '(not set)';

        var firstSource = saved.first_source || latestSource;
        var firstMedium = saved.first_medium || latestMedium;
        var firstCampaign = saved.first_campaign || latestCampaign;

        var attribution = {
            first_source: firstSource,
            first_medium: firstMedium,
            first_campaign: firstCampaign,
            latest_source: latestSource,
            latest_medium: latestMedium,
            latest_campaign: latestCampaign,
            utm_source: incoming.utm_source || saved.utm_source || '',
            utm_medium: incoming.utm_medium || saved.utm_medium || '',
            utm_campaign: incoming.utm_campaign || saved.utm_campaign || '',
            utm_content: incoming.utm_content || saved.utm_content || '',
            utm_term: incoming.utm_term || saved.utm_term || '',
            gclid: incoming.gclid || saved.gclid || '',
            fbclid: incoming.fbclid || saved.fbclid || '',
            ttclid: incoming.ttclid || saved.ttclid || '',
            msclkid: incoming.msclkid || saved.msclkid || '',
            igshid: incoming.igshid || saved.igshid || '',
            first_landing_page: saved.first_landing_page || window.location.href,
            first_referrer: saved.first_referrer || referrer || '',
            first_visit_at: saved.first_visit_at || timestamp,
            last_landing_page: window.location.href,
            last_referrer: referrer || saved.last_referrer || '',
            last_visit_at: timestamp
        };

        if (hasUtm(incoming)) {
            attribution.latest_source = incoming.utm_source || attribution.latest_source;
            attribution.latest_medium = incoming.utm_medium || attribution.latest_medium;
            attribution.latest_campaign = incoming.utm_campaign || attribution.latest_campaign;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
        return attribution;
    }

    function setHidden(form, name, value) {
        var input = form.querySelector('input[name="' + name + '"]');
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            form.appendChild(input);
        }
        input.value = value || '';
    }

    function attachAttributionToForm(form) {
        if (!form || form.tagName !== 'FORM') return;

        var attribution = safeParse(localStorage.getItem(STORAGE_KEY));
        if (!Object.keys(attribution).length) {
            attribution = buildAttribution();
        }

        var fields = {
            utm_source: attribution.utm_source || attribution.latest_source || '',
            utm_medium: attribution.utm_medium || attribution.latest_medium || '',
            utm_campaign: attribution.utm_campaign || attribution.latest_campaign || '',
            utm_content: attribution.utm_content || '',
            utm_term: attribution.utm_term || '',
            first_source: attribution.first_source || '',
            first_medium: attribution.first_medium || '',
            first_campaign: attribution.first_campaign || '',
            latest_source: attribution.latest_source || '',
            latest_medium: attribution.latest_medium || '',
            latest_campaign: attribution.latest_campaign || '',
            first_landing_page: attribution.first_landing_page || '',
            last_landing_page: attribution.last_landing_page || window.location.href,
            first_referrer: attribution.first_referrer || '',
            last_referrer: attribution.last_referrer || document.referrer || '',
            first_visit_at: attribution.first_visit_at || '',
            last_visit_at: attribution.last_visit_at || nowIso(),
            gclid: attribution.gclid || '',
            fbclid: attribution.fbclid || '',
            ttclid: attribution.ttclid || '',
            msclkid: attribution.msclkid || '',
            igshid: attribution.igshid || '',
            current_page: window.location.href
        };

        Object.keys(fields).forEach(function (name) {
            setHidden(form, name, fields[name]);
        });
    }

    function pushDataLayerEvent(attribution) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'attribution_ready',
            attribution_source: attribution.latest_source || '',
            attribution_medium: attribution.latest_medium || '',
            attribution_campaign: attribution.latest_campaign || '',
            attribution_landing_page: attribution.last_landing_page || ''
        });
    }

    var state = buildAttribution();
    pushDataLayerEvent(state);

    document.addEventListener('submit', function (event) {
        attachAttributionToForm(event.target);
    }, true);

    // 전화 버튼(tel: 링크) 클릭 추적: GTM 트리거용 phone_click 이벤트만 남김.
    // 실제 통화 여부/발신자 정보는 알 수 없으므로 ERP 리드로는 보내지 않음.
    // 데스크톱 tel: 클릭은 통화로 이어지지 않는 경우가 많아 모바일만 집계한다.
    function isMobileClient() {
        var ua = navigator.userAgent || '';
        if (/Android|iPhone|iPod|Windows Phone|Mobile/i.test(ua)) return true;
        // iPadOS 13+ 는 Mac처럼 보이므로 터치 지원으로 보조 판별
        if (/iPad/i.test(ua)) return true;
        if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
        return false;
    }

    var lastPhoneClickAt = 0;

    document.addEventListener('click', function (event) {
        if (!isMobileClient()) return;

        var link = event.target.closest ? event.target.closest('a[href^="tel:"]') : null;
        if (!link) return;

        // 같은 탭에서 연속 클릭으로 전환이 부풀지 않도록 3초 내 중복 무시
        var now = Date.now();
        if (now - lastPhoneClickAt < 3000) return;
        lastPhoneClickAt = now;

        var attribution = safeParse(localStorage.getItem(STORAGE_KEY));
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'phone_click',
            phone_number: link.getAttribute('href').replace(/^tel:/, ''),
            click_page: window.location.pathname,
            click_source: attribution.latest_source || '',
            click_medium: attribution.latest_medium || '',
            click_device: 'mobile'
        });
    }, true);
})();
