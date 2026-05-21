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
})();
