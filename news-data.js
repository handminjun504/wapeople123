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
        slug: '2026-05-21',
        title: '법인세가 예상보다 많이 나왔다면, 경리업무 문제일 수 있습니다',
        category: '경리뉴스',
        date: '2026-05-21',
        summary: '법인세 신고 끝나고 나서 \"왜 이렇게 많이 나왔지?\" 싶었던 적 있으신가요?

매출이 늘어서 세금이 오르는 건 어쩔 수 없습니다. 하지만 증빙 누락, 비용 오분류, 공제 항목 미처리 같은 이유로 더 내고 있다면 얘기가 다릅니다.',
        cover: '',
        url: 'news/2026-05-21.html'
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
        '정책자금': { bg: 'bg-blue-100',    text: 'text-blue-700',    grad: 'from-blue-100 to-blue-50',       icon: 'fa-building-columns' },
        '지원금':   { bg: 'bg-emerald-100', text: 'text-emerald-700', grad: 'from-emerald-100 to-emerald-50', icon: 'fa-hand-holding-heart' },
        '경리뉴스': { bg: 'bg-amber-100',   text: 'text-amber-700',   grad: 'from-amber-100 to-amber-50',     icon: 'fa-newspaper' },
        '실무팁':   { bg: 'bg-rose-100',    text: 'text-rose-700',    grad: 'from-rose-100 to-rose-50',       icon: 'fa-lightbulb' }
    };
    var DEFAULT_STYLE = { bg: 'bg-gray-100', text: 'text-gray-700', grad: 'from-gray-100 to-gray-50', icon: 'fa-newspaper' };

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

        var cover;
        if (post.cover) {
            cover = '<img src="' + escapeHtml(post.cover) + '" alt="" loading="lazy" class="w-full h-44 object-cover">';
        } else {
            cover = '<div class="w-full h-44 bg-gradient-to-br ' + style.grad + ' flex items-center justify-center">' +
                    '<i class="fas ' + style.icon + ' text-5xl ' + style.text + ' opacity-70"></i>' +
                    '</div>';
        }

        return '' +
            '<a href="' + url + '" class="news-card group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300" ' +
                'data-category="' + safeCategory + '" ' +
                'data-search="' + escapeHtml(((post.title || '') + ' ' + (post.summary || '')).toLowerCase()) + '">' +
                cover +
                '<div class="p-5 md:p-6">' +
                    '<div class="flex items-center gap-2 mb-3">' +
                        '<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ' + style.bg + ' ' + style.text + '">' +
                            '<i class="fas ' + style.icon + ' text-[10px]"></i>' +
                            safeCategory +
                        '</span>' +
                        '<span class="text-xs text-gray-400">' + displayDate + '</span>' +
                    '</div>' +
                    '<h3 class="text-lg md:text-xl font-bold text-gray-900 mb-2 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">' +
                        safeTitle +
                    '</h3>' +
                    '<p class="text-sm text-gray-600 leading-relaxed line-clamp-3">' +
                        safeSummary +
                    '</p>' +
                    '<div class="mt-4 flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 gap-1 transition-all">' +
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
