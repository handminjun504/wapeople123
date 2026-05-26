const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const SOURCE_DIR = path.join(ROOT_DIR, 'gnrl');
const OUTPUT_FILE = path.join(ROOT_DIR, 'review-data.js');
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
// 익명성을 유지하면서도 placeholder("OO") 보다 자연스럽게 보이도록 한 글자만 ●로 가린다.
// 한국 중소기업에서 흔한 두 글자 한자식 작명 + 업종 패턴.
// 대기업/유명 브랜드와 명확히 겹치는 표기는 회피.
const DISPLAY_TITLES = [
  '동●건설',
  '한●산업',
  '(주)신●',
  '정●이엔씨',
  '우●개발',
  '명●물류',
  '청●유통',
  '대●푸드',
  '진●메디칼',
  '성●플랜트',
  '(주)미●건설',
  '강●솔루션',
  '(주)광●전기',
  '태●파트너스',
  '(주)윤●개발',
  '인●시스템',
  '(주)길●기공',
  '영●팩토리',
  '(주)민●',
  '지●홀딩스',
];
const DISPLAY_DATES = [
  '2026.03.04',
  '2026.03.03',
  '2026.03.02',
  '2026.02.28',
  '2026.02.27',
  '2026.02.26',
  '2026.02.25',
  '2026.02.24',
  '2026.02.23',
  '2026.02.22',
  '2026.02.21',
  '2026.02.20',
  '2026.02.19',
  '2026.02.18',
  '2026.02.17',
  '2026.02.16',
  '2026.02.15',
  '2026.02.14',
  '2026.02.13',
  '2026.02.12',
];

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function walkImages(dirPath, collector) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkImages(fullPath, collector);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(extension)) {
      continue;
    }

    const relativePath = toPosixPath(path.relative(ROOT_DIR, fullPath));
    collector.push({
      image: relativePath,
    });
  }
}

function generateReviewDataContent(items) {
  const lines = [];
  lines.push('(function () {');
  lines.push("    'use strict';");
  lines.push('    window.WA_REVIEW_DATA = [');

  items.forEach((item, index) => {
    const comma = index < items.length - 1 ? ',' : '';
    const image = item.image.replace(/'/g, "\\'");
    const title = item.title.replace(/'/g, "\\'");
    lines.push(`        { image: '${image}', title: '${title}', date: '${item.date}' }${comma}`);
  });

  lines.push('    ];');
  lines.push('})();');
  lines.push('');
  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    fs.writeFileSync(OUTPUT_FILE, generateReviewDataContent([]), 'utf8');
    console.log('[generate-review-data] source directory not found, wrote empty dataset');
    return;
  }

  const rawItems = [];
  walkImages(SOURCE_DIR, rawItems);

  // macOS HFS+/APFS는 파일명을 NFD로, 일반 환경은 NFC로 다루기 때문에
  // git 인덱스에 두 형태가 동시에 들어가면 같은 파일이 두 번 잡혀 중복 카드가 나온다.
  // 항상 NFC로 정규화하고 dedup하여 빌드 환경에 관계없이 동일한 결과를 보장한다.
  const seen = new Set();
  const items = [];
  for (const item of rawItems) {
    const normalized = item.image.normalize('NFC');
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    items.push({ image: normalized });
  }
  items.sort((a, b) => a.image.localeCompare(b.image, 'ko'));

  const displayItems = items.map((item, index) => ({
    image: item.image,
    title: DISPLAY_TITLES[index % DISPLAY_TITLES.length],
    date: DISPLAY_DATES[index % DISPLAY_DATES.length],
  }));

  const content = generateReviewDataContent(displayItems);
  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  console.log(`[generate-review-data] wrote ${displayItems.length} items to ${path.basename(OUTPUT_FILE)}`);
}

main();
