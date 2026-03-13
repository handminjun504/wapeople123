const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const SOURCE_DIR = path.join(ROOT_DIR, 'gnrl');
const OUTPUT_FILE = path.join(ROOT_DIR, 'review-data.js');
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const DISPLAY_TITLES = [
  'OO건설',
  'OO주식회사',
  '(주)OO',
  'OO이엔씨',
  'OO개발',
  'OO물류',
  'OO유통',
  'OO푸드',
  'OO메디칼',
  'OO플랜트',
  '(주)OO건설',
  'OO솔루션',
  '(주)OO전기',
  'OO파트너스',
  '(주)OO개발',
  'OO시스템',
  '(주)OO기공',
  'OO팩토리',
  '(주)OO',
  'OO홀딩스',
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

  const items = [];
  walkImages(SOURCE_DIR, items);
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
