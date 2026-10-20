/* Footer visitor counter — fills #visitor-counter from /api/visitor-count.
 * Values come from GA4 (real numbers only); the element stays hidden when the
 * endpoint is unavailable, so the footer never shows a placeholder or a broken value. */
(function () {
    'use strict';

    var el = document.getElementById('visitor-counter');
    if (!el) return;

    function format(n) {
        var value = Number(n) || 0;
        try {
            return value.toLocaleString('ko-KR');
        } catch (error) {
            return String(value);
        }
    }

    fetch('/api/visitor-count', { headers: { 'Accept': 'application/json' } })
        .then(function (response) {
            return response.ok ? response.json() : null;
        })
        .then(function (data) {
            if (!data || !data.ok) return;
            var today = el.querySelector('[data-visitor-today]');
            var total = el.querySelector('[data-visitor-total]');
            if (today) today.textContent = format(data.today);
            if (total) total.textContent = format(data.total);
            el.hidden = false;
        })
        .catch(function () { /* keep hidden */ });
})();
