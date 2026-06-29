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
            '#waMobileCall{position:fixed;left:1rem;bottom:1.5rem;z-index:9998;' +
            'display:flex;align-items:center;gap:8px;background:#16a34a;color:#fff;' +
            'font-weight:700;font-size:15px;line-height:1;padding:13px 20px;' +
            'border-radius:9999px;box-shadow:0 6px 20px rgba(0,0,0,0.25);' +
            'text-decoration:none;-webkit-tap-highlight-color:transparent;}' +
            '#waMobileCall:active{transform:scale(0.96);}' +
            '#waMobileCall i{font-size:16px;}' +
            '@media (min-width:768px){#waMobileCall{display:none;}}';
        document.head.appendChild(style);

        var btn = document.createElement('a');
        btn.id = 'waMobileCall';
        btn.href = 'tel:' + PHONE;
        btn.setAttribute('aria-label', '전화 상담하기 ' + PHONE);
        btn.innerHTML = '<i class="fas fa-phone-alt" aria-hidden="true"></i><span>빠른 전화 상담</span>';
        btn.addEventListener('click', function () {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: 'phone_call_click', phone: PHONE });
        });
        document.body.appendChild(btn);
    })();
})();
