# 경리소식 — 새 글 작성 가이드

이 폴더는 `https://wapeople.kr/news` 블로그(경리소식)의 개별 글이 저장되는 곳입니다.

> **이 페이지가 다루는 주제** : 중소기업·소상공인 **정책자금**, 정부 **지원금**(고용·청년채용 등), **경리·회계 뉴스**, 경리 담당자가 바로 쓰는 **실무 팁**.
> 세무 신고·세법 해석 등 세무 자문 영역은 다루지 않습니다(거래 세무사와 협업하는 구조).

---

## 1. 새 글 추가 절차 (3단계)

### ① 템플릿 복사

`news/_template.html` 을 같은 폴더에 복사한 뒤, 파일명을 슬러그(URL)로 바꿉니다.

```
news/_template.html  →  news/2026-05-21-policy-fund-spring.html
```

**슬러그(slug) 작성 규칙**

- 영문 소문자 + 숫자 + 하이픈만 사용 (한글/공백 금지 — URL 인코딩 문제 발생)
- 작성일을 앞에 두면 정렬·관리가 편함: `YYYY-MM-DD-keyword`
- 권장 예시:
  - 정책자금: `2026-05-21-policy-fund-spring`, `2026-06-01-sme-loan-update`
  - 지원금: `2026-05-21-youth-employment-grant`, `2026-06-01-job-creation-fund`
  - 경리뉴스: `2026-05-21-accounting-news-roundup`
  - 실무팁: `2026-05-21-receivables-checklist`

### ② 본문 채우기

새로 만든 HTML 파일을 열고 `[[ ]]` 로 표시된 자리표시자를 모두 교체합니다.

| 자리표시자 | 의미 | 예시 |
|---|---|---|
| `[[글 제목]]` | 페이지 제목 | `2026년 상반기 중소기업 정책자금 총정리` |
| `[[글 요약]]` | 1~2줄 요약 (100~150자) | meta description, OG description에 그대로 사용됨 |
| `[[slug]]` | 위에서 정한 슬러그 | `2026-05-21-policy-fund-spring` |
| `[[YYYY-MM-DD]]` | 작성일 (machine-readable) | `2026-05-21` |
| `[[YYYY. MM. DD.]]` | 작성일 (사람이 읽는 형태) | `2026. 05. 21.` |
| `[[카테고리]]` | 카테고리명 | `정책자금` `지원금` `경리뉴스` `실무팁` 중 하나 |
| `[[키워드,쉼표로,구분]]` | meta keywords | `정책자금, 중소기업, 운전자금, 신청일정` |
| `[[중제목 1]]`, `[[본문 단락]]` 등 | 본문 내용 | 자유롭게 작성 |

> 카테고리 배지 색상은 `_template.html` 의 카테고리 배지 영역에 적힌 색상 가이드 주석을 참고해 클래스명만 바꿔주세요.

### ③ 메타데이터 등록

루트의 `news-data.js` 파일을 열고 `WA_NEWS_DATA` 배열의 **맨 앞**에 객체 1개를 추가합니다.

```js
window.WA_NEWS_DATA = [
    {
        slug: '2026-05-21-policy-fund-spring',
        title: '2026년 상반기 중소기업 정책자금, 우리 회사가 받을 수 있는 항목 총정리',
        category: '정책자금',
        date: '2026-05-21',
        summary: '운전자금·시설자금·신성장기반자금 등 항목별 한도와 금리, 신청 일정을 한눈에 정리했습니다.',
        cover: '',                                         // 비워두면 카테고리 그라디언트로 자동 처리
        url: '/news/2026-05-21-policy-fund-spring'         // '/news/{slug}' — .html 을 붙이지 않습니다
    },
    // 기존 글들은 그대로 유지
];
```

이 한 줄을 추가하면 `/news` 목록 페이지의 카드 그리드에 자동으로 노출됩니다.

### 자동으로 처리되는 것 (직접 수정하지 마세요)

배포(Vercel 빌드) 때 `scripts/generate-seo-files.js` 가 글 HTML의 canonical·구조화 데이터를 읽어 아래 파일을 새로 만듭니다.

- `sitemap.xml` — 글 URL과 lastmod(NewsArticle `dateModified`, 없으면 `datePublished`)
- `rss.xml` — 경리소식 RSS 피드(네이버 서치어드바이저 등록용)
- `llms.txt`, `llms-full.txt` 의 경리소식 목록(`AUTO:NEWS` 구간)

배포가 성공하면 GitHub Actions(`.github/workflows/indexnow.yml`)가 바뀐 글 주소를 네이버·Bing에 IndexNow로 알립니다.
그래서 위 파일을 손으로 고칠 필요가 없고, 고쳐도 다음 빌드에서 덮어써집니다.

> 기존 글을 고쳤다면 NewsArticle 구조화 데이터의 `dateModified` 를 고친 날짜로 바꿔주세요. 검색엔진이 수정 사실을 sitemap에서 알아챕니다.

---

## 2. 카테고리

| 카테고리 | 색상 | 활용 예 |
|---|---|---|
| 정책자금 | 블루 (`fa-building-columns`) | 중소벤처기업부·소상공인진흥공단·지자체 정책자금 일정·한도·요건 변경 |
| 지원금 | 에메랄드 (`fa-hand-holding-heart`) | 고용창출장려금, 청년채용 지원금, 인건비 환급 등 회사가 신청 가능한 정부 지원금 |
| 경리뉴스 | 앰버 (`fa-newspaper`) | 경리·회계 도메인 뉴스, 회계 기준 업데이트, 업계 동향, 외부 기사 큐레이션 |
| 실무팁 | 로즈 (`fa-lightbulb`) | 경리 담당자가 바로 쓰는 도구·체크리스트·운영 노하우 |

> 세무 신고·세법 해석 등 세무 자문 영역은 다루지 않습니다. (저희는 경리 아웃소싱 회사이며, 세무 업무는 거래 세무사와 협업합니다)

---

## 3. 이미지 사용

본문에 이미지를 넣으려면 `assets/news/` 폴더에 업로드한 뒤 다음과 같이 사용합니다.

```html
<img src="/assets/news/2026-05-21-cover.webp" alt="2026년 부가세 신고 일정" width="1200" height="675" loading="lazy">
```

> 가능하면 WebP 포맷, 가로 1200px 이하로 최적화해서 올려주세요. (속도/모바일 데이터 절약)
> `width`·`height` 를 실제 이미지 크기로 적으면 이미지가 뜰 때 화면이 밀리지 않습니다.

공유 미리보기(og:image·twitter:image)와 NewsArticle `image` 는 기본값 `https://wapeople.kr/assets/og/news.png`(1200×630)를 그대로 쓰면 됩니다.
글 전용 이미지를 쓰려면 1200×630 크기로 만들어 세 곳을 함께 바꾸세요. (`logo.png` 는 913×187이라 공유 미리보기에 맞지 않습니다)

---

## 4. 발행 후 확인

배포 후 다음을 확인하세요.

- [ ] `https://wapeople.kr/news` 목록에 카드가 보이는가
- [ ] 카드 클릭 시 글 페이지로 이동되는가
- [ ] 모바일에서 글 본문이 깨끗하게 보이는가
- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) 에서 NewsArticle/BreadcrumbList 구조화 데이터가 통과하는가
- [ ] `https://wapeople.kr/sitemap.xml`·`https://wapeople.kr/rss.xml` 에 글이 들어갔는가 (자동 — 빠졌다면 canonical 주소와 파일명이 같은지 확인)
- [ ] GitHub Actions의 **IndexNow** 실행이 성공했는가 (자동)

---

## 5. 자주 하는 실수

- ❌ `slug` 에 한글이나 공백을 넣음 → URL이 깨집니다.
- ❌ `news-data.js` 의 `url` 이 실제 파일명과 다름 → 카드 클릭 시 404. 형식은 `/news/{slug}` 입니다.
- ❌ `[[카테고리]]` 자리표시자만 바꾸고 배지 클래스는 안 바꿈 → 배지 색이 카테고리와 안 맞음.
- ❌ `canonical` URL을 안 바꿈 → 검색 엔진이 동일 URL을 중복 인덱싱.
- ❌ 다른 곳에서 만든 **완성된 HTML 문서**(`<!DOCTYPE>`·`<head>`·`<title>`·`<h1>`·전역 `<style>` 포함)를 본문에 통째로 붙여넣음 → 제목(H1)과 구조화 데이터가 중복되고, `body {}` 같은 전역 스타일이 페이지 전체 글꼴·여백을 바꿉니다. 본문 요소만 넣고, 꼭 필요한 스타일은 `.article-body` 로 시작하는 선택자로 작성하세요.
- ❌ 본문 안에 FAQPage 구조화 데이터를 한 번 더 넣음 → 머리말(`<head>`)의 FAQPage 하나에 질문을 모두 넣으세요. 한 페이지에 FAQPage는 하나만 둡니다.
- ❌ `sitemap.xml`·`rss.xml`·`llms.txt` 를 직접 수정 → 다음 빌드에서 덮어써집니다. (위 "자동으로 처리되는 것" 참고)
- ❌ 사이트 안 링크를 `../about.html` 처럼 씀 → `/about` 처럼 `.html` 없는 절대 경로로 쓰세요. `.html` 주소는 한 번 더 리다이렉트됩니다.

---

문의: `wapeople000@gmail.com`
