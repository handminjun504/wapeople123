(function () {
    function isActionKey(event) {
        return event.key === 'Enter' || event.key === ' ';
    }

    function markAsButtonLike(element) {
        if (!element.hasAttribute('role')) {
            element.setAttribute('role', 'button');
        }
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
    }

    document.querySelectorAll('div[onclick], span[onclick]').forEach(markAsButtonLike);
    document.querySelectorAll('a[onclick]:not([href])').forEach(markAsButtonLike);

    document.addEventListener('keydown', function (event) {
        if (!isActionKey(event)) {
            return;
        }

        if (event.target.matches('input, textarea, select')) {
            return;
        }

        var target = event.target.closest('[role="button"][onclick]');
        if (!target) {
            return;
        }

        event.preventDefault();
        target.click();
    });

    // 카피라이트 연도 자동 갱신: <span class="copyright-year">YYYY</span>
    var currentYear = new Date().getFullYear();
    document.querySelectorAll('.copyright-year').forEach(function (el) {
        el.textContent = currentYear;
    });

    // 모바일 전용 빠른 전화 상담 버튼 (누르면 바로 전화 연결)
    (function () {
        var PHONE = '1566-2687';
        if (document.getElementById('waMobileCall')) {
            return;
        }

        var style = document.createElement('style');
        style.textContent =
            '#waMobileCall{position:fixed;left:0;right:0;bottom:0;z-index:9998;' +
            'display:flex;align-items:center;justify-content:center;gap:9px;' +
            'background:#16a34a;color:#fff;font-weight:700;font-size:16px;line-height:1;' +
            'padding:15px 16px;padding-bottom:calc(15px + env(safe-area-inset-bottom,0px));' +
            'box-shadow:0 -2px 14px rgba(0,0,0,0.16);text-decoration:none;' +
            '-webkit-tap-highlight-color:transparent;}' +
            '#waMobileCall:active{background:#15803d;}' +
            '#waMobileCall i{font-size:16px;}' +
            '#waMobileCall .wa-call-sub{font-weight:500;font-size:13px;opacity:0.85;}' +
            // 하단 바에 콘텐츠가 가리지 않도록 여백 확보 + 맨 위로 버튼을 바 위로 올림
            '@media (max-width:767px){body{padding-bottom:60px;}' +
            '#scrollToTop{bottom:5rem !important;}}' +
            '@media (min-width:768px){#waMobileCall{display:none;}}';
        document.head.appendChild(style);

        var btn = document.createElement('a');
        btn.id = 'waMobileCall';
        btn.href = 'tel:' + PHONE;
        btn.setAttribute('aria-label', '전화 상담하기 ' + PHONE);
        btn.innerHTML = '<i class="fas fa-phone-alt" aria-hidden="true"></i>' +
            '<span>전화 상담</span>' +
            '<span class="wa-call-sub">' + PHONE + '</span>';
        btn.addEventListener('click', function () {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: 'phone_call_click', phone: PHONE });
        });
        document.body.appendChild(btn);
    })();
})();
