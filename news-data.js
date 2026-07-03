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
        slug: 'jungjingoung-sojingoung-jeongsaekjageum',
        title: '중소기업 정책자금이란? — 중진공·소진공 한 번에 정리',
        category: '정책자금',
        date: '2026-07-03',
        summary: '정책자금은 정부가 중소기업·소상공인에게 시중 금리보다 낮은 조건으로 제공하는 융자 제도입니다. 담보가 부족하거나 시중 금융 이용이 어려운 기업에게 자금을 공급하는 것이 핵심 목적입니다.',
        cover: '',
        url: 'news/jungjingoung-sojingoung-jeongsaekjageum.html'
    },

    {
        slug: 'wongyeok-gyeongri-ranhgan',
        title: '원격경리란? — 비대면으로 경리 업무를 맡기는 방법 완전정리',
        category: '경리뉴스',
        date: '2026-07-01',
        summary: '원격경리는 경리 직원을 직접 채용하지 않고, 외부 전문 담당자가 비대면으로 회사 경리 업무를 처리하는 서비스입니다. 사무실에 출근하는 직원 없이 세금계산서·장부·미수미지급·손익 보고까지 온라인으로 처리됩니다.',
        cover: '',
        url: 'news/wongyeok-gyeongri-ranhgan.html'
    },

    {
        slug: 'gyeongri-outsourcing-ranhgan',
        title: '경리 아웃소싱이란?',
        category: '경리뉴스',
        date: '2026-06-30',
        summary: '경리 아웃소싱은 회사 내부에서 직접 처리하던 경리 업무를 외부 전문 인력에게 맡기는 것을 말합니다. 세무사에게 자료만 넘기는 기장대행과는 다릅니다. 세금계산서, 장부, 미수미지급, 손익까지 매달 일상 업무 전체를 처리합니다.',
        cover: '',
        url: 'news/gyeongri-outsourcing-ranhgan.html'
    },

    {
        slug: 'saeop-chogi-gyeongri-silsu-top5',
        title: '사업 초기 경리 실수 TOP 5',
        category: '실무팁',
        date: '2026-06-29',
        summary: '창업 초기에는 영업과 운영이 우선이다 보니 경리는 뒤로 밀립니다. 하지만 초기에 쌓인 경리 실수는 나중에 훨씬 더 큰 부담이 됩니다. 지금 하나씩 확인하고 잡아두세요.',
        cover: '',
        url: 'news/saeop-chogi-gyeongri-silsu-top5.html'
    },

    {
        slug: '2026-06-26',
        title: '식당 사장님, 메뉴별 원가율 알고 계신가요?',
        category: '경리뉴스',
        date: '2026-06-26',
        summary: '잘 팔리는 메뉴가 남는 메뉴가 아닙니다. 배달까지 포함하면 더욱 그렇습니다. 메뉴별 원가율 계산 → 배달 실질 마진 파악 → 홀·배달 구조 설계, 이 세 가지를 잡으면 바쁘게 팔면서 손해 보는 구조를 벗어날 수 있습니다.',
        cover: '',
        url: 'news/2026-06-26.html'
    },

        {
        slug: 'kyungrinara-guide',
        title: '경리나라란 무엇인가요 — 소상공인 경리 프로그램 기능과 활용법',
        category: '실무팁',
        date: '2026-06-25',
        summary: '경리나라는 회계 지식 없이도 쓸 수 있도록 만든 소상공인·중소기업 전용 경리 프로그램입니다. 계좌 자동 연동 → 증빙 자동 수집 → 손익 보고서 자동 생성, 반복 경리 업무를 자동화해줍니다.',
        cover: '',
        url: 'news/kyungrinara-guide.html'
    },

    {
        slug: 'gyeongri-jikwon-chaeyong-vs-daehang',
        title: '경리 직원 채용 vs 경리대행 — 비용·리스크·효율 완전 비교',
        category: '경리뉴스',
        date: '2026-06-24',
        summary: '경리 직원을 채용할지, 경리대행을 맡길지 고민 중이라면 먼저 실제 비용을 숫자로 비교해보세요. 직원 수, 거래 복잡도, 업종에 따라 답이 달라집니다. 이 글에서 규모별로 정리했습니다.',
        cover: '',
        url: 'news/gyeongri-jikwon-chaeyong-vs-daehang.html'
    },

    {
        slug: 'labor-cost-management',
        title: '매출은 그대론데 인건비만 오르고 있다면',
        category: '경리뉴스',
        date: '2026-06-23',
        summary: '매출이 늘지 않는데 인건비만 오르면 남는 돈은 매달 줄어듭니다. 인건비 비율 파악 → 원인 진단 → 구조 개선, 이 순서로 접근해야 감이 아니라 숫자로 대응할 수 있습니다.',
        cover: '',
        url: 'news/labor-cost-management.html'
    },

    {
        slug: 'gyeongri-jikwon-toesa-gongbaek',
        title: '경리 직원 퇴사 후 공백, 어떻게 해야 하나요?',
        category: '경리뉴스',
        date: '2026-06-19',
        summary: '경리 직원이 나가면 세금계산서, 장부정리, 미수미지급, 손익 파악이 한꺼번에 멈춥니다. 당장 무엇부터 챙겨야 하는지, 공백을 현실적으로 메우는 방법을 순서대로 정리했습니다.',
        cover: '',
        url: 'news/gyeongri-jikwon-toesa-gongbaek.html'
    },

    {
        slug: 'gyeongri-hoengnyeong-yeobang',
        title: '경리 횡령, 우리 회사는 괜찮을까요?',
        category: '경리뉴스',
        date: '2026-06-16',
        summary: '횡령은 뉴스에 나오는 대기업만의 이야기가 아닙니다. 실제로는 중소기업·소기업에서 훨씬 더 많이 발생합니다. 모르고 있기 때문입니다. 그리고 모르는 동안 돈은 계속 빠져나갑니다.',
        cover: '',
        url: 'news/gyeongri-hoengnyeong-yeobang.html'
    },

    {
        slug: 'jaego-gwanri-gyeongri',
        title: '재고관리가 안 되면 원가도 손익도 모릅니다',
        category: '경리뉴스',
        date: '2026-06-09',
        summary: '재고가 얼마나 남았는지 모르면 팔린 물건의 원가를 계산할 수 없습니다. 원가가 틀리면 손익이 왜곡되고, 손익이 왜곡되면 세금 신고까지 오류가 이어집니다. 재고관리는 단순한 창고 정리가 아닙니다.',
        cover: '',
        url: 'news/jaego-gwanri-gyeongri.html'
    },

    {
        slug: 'migyongil-nailshop-gyeongri-daehang',
        title: '미용실·네일샵 경리대행',
        category: '경리뉴스',
        date: '2026-06-08',
        summary: '미용실·네일샵은 직원 급여 구조가 복잡하고 현금·카드 매출이 섞여 있어 경리를 혼자 처리하면 매달 급여 날이 가장 스트레스입니다. 인센티브 계산, 세금계산서 관리, 손익 파악까지 — 이걸 전부 혼자 하는 건 원장님 몫이 아닙니다.',
        cover: '',
        url: 'news/migyongil-nailshop-gyeongri-daehang.html'
    },

    {
        slug: 'gyeongri-daehang-biyong',
        title: '경리대행 비용 얼마예요? — 직원 채용과 숫자로 비교했습니다',
        category: '경리뉴스',
        date: '2026-06-05',
        summary: '\"경리대행 비용이 얼마나 해요?\"라는 질문을 가장 많이 받습니다. 경리대행 비용만 놓고 보면 비싸 보일 수 있지만, 경리 직원을 직접 채용했을 때 드는 실제 비용과 비교하면 이야기가 완전히 달라집니다.',
        cover: '',
        url: 'news/gyeongri-daehang-biyong.html'
    },

    {
        slug: '2026-06-04',
        title: '카페 손익분기점 계산 방법 — 하루 몇 잔 팔아야 적자가 아닌가요?',
        category: '경리뉴스',
        date: '2026-06-04',
        summary: '매출은 나오는데 통장이 비는 카페, 이유는 대부분 메뉴별 원가율을 모르거나 고정비 구조를 파악하지 못해서입니다. 메뉴별 마진 분석 → 고정비·변동비 구조 파악 → 손익분기점 계산, 이 세 가지를 잡으면 어디서 새는지 보입니다.',
        cover: '',
        url: 'news/2026-06-04.html'
    },

    {
        slug: '2026-06-01',
        title: '유튜버·크리에이터라면 경영관리가 달라야 합니다',
        category: '경리뉴스',
        date: '2026-06-01',
        summary: '광고수익·협찬·굿즈·슈퍼챗이 섞여있는 크리에이터의 수익 구조는 일반 사업자와 다릅니다. 수익 채널별 분리 → 콘텐츠별 마진 분석 → 비용 체계화, 이 세 가지를 잡으면 매출이 오를수록 더 많이 남습니다.',
        cover: '',
        url: 'news/2026-06-01.html'
    },

    {
        slug: '2026-05-29-720',
        title: '청년 채용하면 최대 720만 원 — 고용지원금 신청 방법 총정리',
        category: '지원금',
        date: '2026-05-29',
        summary: '청년을 정규직으로 채용하면 최대 720만 원을 받을 수 있는 일자리도약장려금. 지원 대상, 청년 유형 10가지, 신청 방법까지 2026년 지침 기준으로 정리했습니다.',
        cover: '',
        url: 'news/2026-05-29-720.html'
    },

    {
        slug: '2026-05-28',
        title: '스타트업 대표님, 경영관리 시스템 없이 버티면 나중에 고생합니다.',
        category: '경리뉴스',
        date: '2026-05-28',
        summary: '사업 키우느라 바쁜 스타트업 대표님들이 놓치는 경영관리 구조 설계. 세금계산서, 손익분석, 마진분석을 지금 안 잡으면 나중에 훨씬 힘들어집니다.',
        cover: '',
        url: 'news/2026-05-28.html'
    },

            {
        slug: 'hagwon-gyeongri-unyeong',
        title: '학원 경리업무, 이렇게 하면 됩니다!',
        category: '경리뉴스',
        date: '2026-05-27',
        summary: '선생님별 담당 수강생 수, 매출, 수업 시간을 기준으로 인센티브를 계산합니다. 이를 자동화하려면 수강생 관리 시스템과 급여 시스템을 연동하거나, 경리대행 서비스를 통해 매월 정확하게 처리할 수 있습니다.',
        cover: '',
        url: 'news/hagwon-gyeongri-unyeong.html'
    },

    {
        slug: 'semusa-vs-gyeongri-daehang-chaijeom',
        title: '세무사 vs 경리대행, 무엇이 다른가요?',
        category: '경리뉴스',
        date: '2026-05-27',
        summary: '— 서비스 범위 완벽 비교',
        cover: '',
        url: 'news/semusa-vs-gyeongri-daehang-chaijeom.html'
    },

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
