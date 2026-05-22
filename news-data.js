(function () {
    'use strict';

    // 경리소식 글 메타데이터
    // 새 글 추가 방법:
    //   1) news/{slug}.html 파일을 news/_template.html을 복사하여 작성
    //   2) 아래 배열의 맨 앞(최신 글이 위로 오도록)에 객체 1개를 추가
    //
    // 필드:
    //   slug      : URL의 마지막 부분 (영문/숫자/하이픈 권장, 예: '2026-05-21-policy-fund-spring')
    //   title     : 글 제목
    //   category  : 카테고리 — '정책자금' | '지원금' | '경리뉴스' | '실무팁'
    //   date      : 작성일 'YYYY-MM-DD'
    //   summary   : 1~2줄 요약 (목록 카드 + meta description 활용 가능)
    //   cover     : (선택) 썸네일 이미지 경로 — 미지정 시 카테고리별 기본 그라디언트 사용
    //   url       : 'news/{slug}.html'
    window.WA_NEWS_DATA = [
    {
        slug: '2026-05-22',
        title: '매출은 나오는데 남는 게 없는 느낌, 기분 탓이 아닙니다',
        category: '경리뉴스',
        date: '2026-05-22',
        summary: '매출에서 인건비, 임차료, 재료비, 수수료까지 빼고 나면 실제로 얼마가 손에 남는지 숫자로 보이지 않으면 사업 판단을 감으로만 하게 됩니다.',
        cover: '',
        url: 'news/2026-05-22.html'
    },


        // 예시 (지운 뒤 실제 글로 교체):
        // {
        //     slug: '2026-05-21-policy-fund-spring',
        //     title: '2026년 상반기 중소기업 정책자금, 우리 회사가 받을 수 있는 항목 총정리',
        //     category: '정책자금',
        //     date: '2026-05-21',
        //     summary: '운전자금·시설자금·신성장기반자금 등 항목별 한도와 금리, 신청 일정을 한눈에 정리했습니다.',
        //     cover: '',
        //     url: 'news/2026-05-21-policy-fund-spring.html'
        // }
    ];

    // ───────────────────────────────────────────────────────────────────
    // 이하: 목록 페이지(news.html) 자동 렌더러
    // ───────────────────────────────────────────────────────────────────

    var CATEGORY_STYLE = {
        '정책자금': { bg: 'bg-blue-100',    text: 'text-blue-700',    grad: 'from-blue-100 to-blue-50',       icon: 'fa-building-columns',  bar: '#2563eb', border: '#93c5fd', tint: 'rgba(37,99,235,0.04)' },
        '지원금':   { bg: 'bg-emerald-100', text: 'text-emerald-700', grad: 'from-emerald-100 to-emerald-50', icon: 'fa-hand-holding-heart', bar: '#059669', border: '#6ee7b7', tint: 'rgba(5,150,105,0.04)' },
        '경리뉴스': { bg: 'bg-amber-100',   text: 'text-amber-700',   grad: 'from-amber-100 to-amber-50',     icon: 'fa-newspaper',         bar: '#d97706', border: '#fcd34d', tint: 'rgba(217,119,6,0.04)' },
        '실무팁':   { bg: 'bg-rose-100',    text: 'text-rose-700',    grad: 'from-rose-100 to-rose-50',       icon: 'fa-lightbulb',         bar: '#e11d48', border: '#fda4af', tint: 'rgba(225,29,72,0.04)' }
    };
    var DEFAULT_STYLE = { bg: 'bg-gray-100', text: 'text-gray-700', grad: 'from-gray-100 to-gray-50', icon: 'fa-newspaper', bar: '#6b7280', border: '#d1d5db', tint: 'transparent' };

    function escapeHtml(value) {
        if (value == null) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(isoDate) {
        if (!isoDate) return '';
        var parts = String(isoDate).split('-');
        if (parts.length !== 3) return escapeHtml(isoDate);
        return parts[0] + '. ' + parts[1] + '. ' + parts[2] + '.';
    }

    function getStyle(category) {
        return CATEGORY_STYLE[category] || DEFAULT_STYLE;
    }

    function renderCard(post) {
        var style = getStyle(post.category);
        var safeTitle = escapeHtml(post.title || '');
        var safeSummary = escapeHtml(post.summary || '');
        var safeCategory = escapeHtml(post.category || '');
        var displayDate = formatDate(post.date);
        var url = escapeHtml(post.url || '#');

        var hasImage = !!post.cover;
        var thumbBg = {
            '정책자금': '#2563eb',
            '지원금':   '#059669',
            '경리뉴스': '#d97706',
            '실무팁':   '#e11d48'
        }[post.category] || '#6b7280';

        var coverHtml = hasImage
            ? '<div class="relative">' +
                  '<img src="' + escapeHtml(post.cover) + '" alt="" loading="lazy" class="w-full h-44 object-cover">' +
                  '<span class="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur ' + style.text + ' shadow-sm">' +
                      '<i class="fas ' + style.icon + ' text-[11px]"></i>' +
                      '<span>' + safeCategory + '</span>' +
                  '</span>' +
              '</div>'
            : '<div style="background:' + thumbBg + ';padding:1.5rem 1.25rem 1rem;display:flex;flex-direction:column;justify-content:space-between;min-height:140px;">' +
                  '<p style="font-size:1.1rem;font-weight:800;color:#fff;line-height:1.5;letter-spacing:-0.02em;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin:0;">' +
                      safeTitle +
                  '</p>' +
                  '<p style="font-size:0.7rem;color:rgba(255,255,255,0.7);margin:0.75rem 0 0;letter-spacing:0.02em;">경리업무를잘하는청년들 &middot; wapeople.kr</p>' +
              '</div>';

        var metaRow = '<div class="flex items-center gap-2 mb-3">' +
                '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ' + style.bg + ' ' + style.text + '">' +
                    '<i class="fas ' + style.icon + ' text-[11px]"></i>' +
                    '<span>' + safeCategory + '</span>' +
                '</span>' +
                '<span class="text-xs text-gray-400">' + displayDate + '</span>' +
              '</div>';

        var cardStyle = 'border:1px solid #e5e7eb;background:#ffffff;';

        return '' +
            '<a href="' + url + '" class="news-card group flex flex-col rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300" ' +
                'style="' + cardStyle + '" ' +
                'data-category="' + safeCategory + '" ' +
                'data-search="' + escapeHtml(((post.title || '') + ' ' + (post.summary || '')).toLowerCase()) + '">' +
                coverHtml +
                '<div class="flex-1 flex flex-col p-5 md:p-6">' +
                    metaRow +
                    (hasImage ? '<h3 class="text-base md:text-lg font-bold text-gray-900 mb-2 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">' + safeTitle + '</h3>' : '') +
                    '<p class="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">' +
                        safeSummary +
                    '</p>' +
                    '<div class="mt-auto inline-flex items-center gap-1 text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">' +
                        '<span>읽어보기</span>' +
                        '<i class="fas fa-arrow-right text-xs"></i>' +
                    '</div>' +
                '</div>' +
            '</a>';
    }

    function getSortedPosts() {
        var posts = (window.WA_NEWS_DATA || []).slice();
        posts.sort(function (a, b) {
            return String(b.date || '').localeCompare(String(a.date || ''));
        });
        return posts;
    }

    function renderList() {
        var grid = document.getElementById('newsGrid');
        var emptyState = document.getElementById('newsEmpty');
        var totalEl = document.getElementById('newsTotal');
        if (!grid) return;

        var posts = getSortedPosts();

        if (totalEl) totalEl.textContent = posts.length;

        if (posts.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        grid.innerHTML = posts.map(renderCard).join('');
    }

    // 카테고리 필터 (전역에서 onclick으로 호출)
    window.filterNews = function (category) {
        var cards = document.querySelectorAll('#newsGrid .news-card');
        var visibleCount = 0;
        cards.forEach(function (card) {
            var match = (category === 'all') || (card.getAttribute('data-category') === category);
            // 검색어와 결합
            var search = (document.getElementById('newsSearch') || {}).value || '';
            var searchMatch = !search || (card.getAttribute('data-search') || '').indexOf(search.toLowerCase()) !== -1;
            if (match && searchMatch) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        document.querySelectorAll('.news-filter-btn').forEach(function (btn) {
            if (btn.getAttribute('data-filter') === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        var searchEmpty = document.getElementById('newsSearchEmpty');
        if (searchEmpty) {
            if (cards.length > 0 && visibleCount === 0) {
                searchEmpty.classList.remove('hidden');
            } else {
                searchEmpty.classList.add('hidden');
            }
        }
    };

    function bindSearch() {
        var input = document.getElementById('newsSearch');
        if (!input) return;
        input.addEventListener('input', function () {
            var activeBtn = document.querySelector('.news-filter-btn.active');
            var category = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
            window.filterNews(category);
        });
    }

    function init() {
        renderList();
        bindSearch();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
