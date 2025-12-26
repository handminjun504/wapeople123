# 경리업무를잘하는청년들 웹사이트

업종별 맞춤 경리 서비스 제공 웹사이트

## 🚀 개발 환경 설정

### 필수 요구사항
- Node.js 14 이상
- npm 또는 yarn

### 설치 방법

```bash
# 의존성 설치
npm install

# Tailwind CSS 빌드 (프로덕션)
npm run build

# Tailwind CSS 개발 모드 (변경사항 자동 감지)
npm run watch
```

## 📁 프로젝트 구조

```
.
├── dist/               # 빌드된 CSS 파일
│   └── output.css     # 최적화된 Tailwind CSS
├── src/               
│   └── input.css      # Tailwind 소스 파일
├── fonts/             # Pretendard 폰트 파일
├── *.html             # 웹페이지 파일들
├── logo.webp          # 로고 이미지
├── logo-2.webp        # 로고 이미지 (변형)
├── package.json       # 프로젝트 설정
├── tailwind.config.js # Tailwind 설정
└── vercel.json        # Vercel 배포 설정
```

## 🎨 기술 스택

- **CSS Framework**: Tailwind CSS (빌드 버전)
- **폰트**: Pretendard
- **애니메이션**: AOS (Animate On Scroll)
- **아이콘**: Font Awesome

## 🔧 개발 가이드

### CSS 수정 시
1. `src/input.css` 파일 수정
2. `npm run build` 실행하여 빌드
3. 브라우저에서 확인

### HTML 수정 시
- HTML 파일을 직접 수정
- Tailwind 클래스 추가/변경 후 `npm run build` 실행

## 📦 배포

빌드된 `dist/output.css` 파일이 자동으로 최적화되어 있습니다:
- 사용하지 않는 CSS 제거 (PurgeCSS)
- Minify 적용
- 프로덕션 최적화

## ✨ 최적화 사항

- ✅ Tailwind CSS CDN → 빌드 버전 전환
- ✅ 사용되지 않는 CSS 자동 제거
- ✅ CSS 파일 압축 (minify)
- ✅ 폰트 로딩 최적화 (font-display: swap)
- ✅ Font Awesome 지연 로딩
- ✅ 모바일 최적화
- ✅ 접근성 (Accessibility) 향상

## 📝 라이센스

Copyright © 2024 경리업무를잘하는청년들
