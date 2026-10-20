/**
 * Build-time generator for sitemap.xml, rss.xml and the AUTO sections of llms.txt / llms-full.txt.
 *
 * The HTML files in the repo are the single source of truth: every indexable page
 * (no noindex, canonical pointing to itself) is listed, so the files can never drift
 * from what is actually deployed.
 *
 * Runs inside `npm run build` on Vercel. It never fails the build: any error is logged
 * with an `[generate-seo-files] ERROR` prefix and the previously committed files are kept.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const SITE_URL = 'https://wapeople.kr';
const LOG_PREFIX = '[generate-seo-files]';

// Order defines the order in sitemap.xml. Pages not listed here use DEFAULT_PAGE_HINT.
const PAGE_HINTS = [
  ['/', '1.0', 'weekly'],
  ['/about', '0.9', 'monthly'],
  ['/all-service', '0.8', 'monthly'],
  ['/service', '0.8', 'monthly'],
  ['/manufacturing', '0.8', 'monthly'],
  ['/construction', '0.8', 'monthly'],
  ['/wholesale', '0.8', 'monthly'],
  ['/restaurant', '0.8', 'monthly'],
  ['/ecommerce', '0.8', 'monthly'],
  ['/expense-management', '0.8', 'monthly'],
  ['/subscription-service', '0.8', 'monthly'],
  ['/faq', '0.8', 'monthly'],
  ['/news', '0.8', 'weekly'],
  ['/reviews', '0.7', 'monthly'],
  ['/manual', '0.6', 'monthly'],
  ['/location', '0.6', 'monthly'],
  ['/privacy', '0.3', 'yearly'],
];
const DEFAULT_PAGE_HINT = { priority: '0.5', changefreq: 'monthly' };
const NEWS_HINT = { priority: '0.6', changefreq: 'monthly' };
const EXCLUDED_FILES = new Set(['404.html', 'news/_template.html']);
const MIN_SITEMAP_URLS = 15;

const NEWS_FAQ_LIMIT = 3;
const CASE_EXCERPT_LENGTH = 220;

function log(message) { console.log(`${LOG_PREFIX} ${message}`); }
function warn(message) { console.warn(`${LOG_PREFIX} WARN ${message}`); }

function decodeEntities(text) {
  return String(text || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, '·').replace(/&amp;/g, '&');
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function stripTags(html) {
  return decodeEntities(String(html || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}

function oneLine(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function parseAttributes(tag) {
  const attrs = {};
  const re = /([a-zA-Z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(tag)) !== null) attrs[m[1].toLowerCase()] = m[3] !== undefined ? m[3] : m[4];
  return attrs;
}

function findTags(html, tagName) {
  return (html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) || []).map(parseAttributes);
}

function parseJsonLd(html, file) {
  const blocks = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch (error) {
      warn(`${file}: invalid JSON-LD ignored (${error.message})`);
    }
  }
  return blocks;
}

function hasType(block, type) {
  return [].concat(block && block['@type'] || []).includes(type);
}

function toCleanPath(relativeFile) {
  const noExt = relativeFile.replace(/\.html$/, '');
  if (noExt === 'index') return '/';
  return '/' + noExt.replace(/\/index$/, '');
}

function listHtmlFiles() {
  const files = [];
  for (const dir of ['', 'manual', 'news']) {
    const abs = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs)) {
      if (!name.endsWith('.html') || name.startsWith('.')) continue;
      const rel = dir ? `${dir}/${name}` : name;
      if (!EXCLUDED_FILES.has(rel)) files.push(rel);
    }
  }
  return files.sort();
}

function isoDate(value) {
  const m = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function todayKst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function gitAvailable() {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: ROOT_DIR, stdio: ['ignore', 'pipe', 'ignore'] });
    return true;
  } catch (_) {
    return false;
  }
}

function gitShallowBoundary() {
  try {
    const shallowFile = execFileSync('git', ['rev-parse', '--git-path', 'shallow'], { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const shallowPath = path.resolve(ROOT_DIR, shallowFile);
    if (!fs.existsSync(shallowPath)) return new Set();
    return new Set(fs.readFileSync(shallowPath, 'utf8').split(/\s+/).filter(Boolean));
  } catch (_) {
    return new Set();
  }
}

function gitLastModified(relativeFile, shallowBoundary) {
  try {
    const dirty = execFileSync('git', ['status', '--porcelain', '--', relativeFile], { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (dirty) return todayKst();
    const [sha, date] = execFileSync('git', ['log', '-1', '--format=%H %cs', '--', relativeFile], { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split(' ');
    // 얕은 복제(shallow clone)의 가장 오래된 커밋은 모든 파일을 새로 추가한 것처럼 보이므로 그 날짜는 쓰지 않는다
    if (!sha || shallowBoundary.has(sha)) return null;
    return isoDate(date);
  } catch (_) {
    return null;
  }
}

function readPreviousLastmods() {
  const file = path.join(ROOT_DIR, 'sitemap.xml');
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  const xml = fs.readFileSync(file, 'utf8');
  for (const block of xml.match(/<url>[\s\S]*?<\/url>/g) || []) {
    const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const lastmod = (block.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    if (loc && lastmod) map.set(decodeEntities(loc), lastmod);
  }
  return map;
}

function loadNewsData() {
  const file = path.join(ROOT_DIR, 'news-data.js');
  if (!fs.existsSync(file)) return [];
  const noop = () => {};
  const element = { classList: { add: noop, remove: noop }, addEventListener: noop };
  const context = {
    window: {},
    document: { readyState: 'complete', getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, createElement: () => element },
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: 'news-data.js', timeout: 2000 });
  return Array.isArray(context.window.WA_NEWS_DATA) ? context.window.WA_NEWS_DATA : [];
}

function loadCaseData() {
  const file = path.join(ROOT_DIR, 'case-data.js');
  if (!fs.existsSync(file)) return [];
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: 'case-data.js', timeout: 2000 });
  return Array.isArray(context.window.WA_CASE_DATA) ? context.window.WA_CASE_DATA : [];
}

function analyzePage(relativeFile, html = fs.readFileSync(path.join(ROOT_DIR, relativeFile), 'utf8')) {
  const headEnd = html.search(/<\/head>/i);
  const head = headEnd >= 0 ? html.slice(0, headEnd) : html;
  const metas = findTags(head, 'meta');
  const meta = (key, value) => (metas.find(m => (m[key] || '').toLowerCase() === value) || {}).content || '';
  const canonicalTag = findTags(head, 'link').find(l => (l.rel || '').toLowerCase() === 'canonical');
  const expectedUrl = SITE_URL + toCleanPath(relativeFile);
  const canonical = canonicalTag && canonicalTag.href ? canonicalTag.href : null;
  const sameUrl = (a, b) => a.replace(/\/$/, '') === b.replace(/\/$/, '');
  const robots = meta('name', 'robots').toLowerCase();
  const jsonLd = parseJsonLd(head, relativeFile);
  const article = jsonLd.find(b => hasType(b, 'NewsArticle') || hasType(b, 'Article') || hasType(b, 'BlogPosting'));
  const faq = parseJsonLd(html, relativeFile).find(b => hasType(b, 'FAQPage'));
  const titleTag = decodeEntities((head.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
  const h1 = stripTags((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');

  return {
    file: relativeFile,
    url: expectedUrl,
    isNews: relativeFile.startsWith('news/'),
    indexable: !robots.includes('noindex') && (!canonical || sameUrl(canonical, expectedUrl)),
    canonical,
    robots,
    hasCanonical: Boolean(canonical),
    title: oneLine((article && article.headline) || h1 || titleTag.replace(/\s*[-|].*$/, '')),
    description: oneLine(meta('name', 'description')),
    category: oneLine((article && article.articleSection) || meta('property', 'article:section')),
    published: isoDate(article && article.datePublished) || isoDate(meta('property', 'article:published_time')),
    modified: isoDate(article && article.dateModified) || isoDate(meta('property', 'article:modified_time')),
    faq: faq && Array.isArray(faq.mainEntity)
      ? faq.mainEntity.map(q => ({ q: oneLine(q.name), a: oneLine(q.acceptedAnswer && q.acceptedAnswer.text) })).filter(q => q.q && q.a)
      : [],
  };
}

function rfc822(isoDay) {
  const date = new Date(`${isoDay}T09:00:00+09:00`);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const kst = new Date(date.getTime() + 9 * 3600 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${days[kst.getUTCDay()]}, ${pad(kst.getUTCDate())} ${months[kst.getUTCMonth()]} ${kst.getUTCFullYear()} ${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}:00 +0900`;
}

function buildSitemap(mainPages, newsPages) {
  const hints = new Map(PAGE_HINTS.map(([p, priority, changefreq]) => [SITE_URL + p, { priority, changefreq }]));
  const order = new Map(PAGE_HINTS.map(([p], i) => [SITE_URL + p, i]));
  const sortedMain = mainPages.slice().sort((a, b) => (order.has(a.url) ? order.get(a.url) : 999) - (order.has(b.url) ? order.get(b.url) : 999) || a.url.localeCompare(b.url));
  const entry = (page, hint) => [
    '  <url>',
    `    <loc>${escapeXml(page.url)}</loc>`,
    page.lastmod ? `    <lastmod>${page.lastmod}</lastmod>` : null,
    `    <changefreq>${hint.changefreq}</changefreq>`,
    `    <priority>${hint.priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
  const body = [
    ...sortedMain.map(p => entry(p, hints.get(p.url) || DEFAULT_PAGE_HINT)),
    ...newsPages.map(p => entry(p, NEWS_HINT)),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body.join('\n')}\n</urlset>\n`;
}

function buildRss(newsPages) {
  const items = newsPages.map(p => [
    '    <item>',
    `      <title>${escapeXml(p.title)}</title>`,
    `      <link>${escapeXml(p.url)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(p.url)}</guid>`,
    `      <description>${escapeXml(p.description)}</description>`,
    p.category ? `      <category>${escapeXml(p.category)}</category>` : null,
    `      <pubDate>${rfc822(p.published)}</pubDate>`,
    '    </item>',
  ].filter(Boolean).join('\n'));
  const lastBuild = newsPages.reduce((max, p) => (p.lastmod > max ? p.lastmod : max), newsPages[0].lastmod);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>경리소식 | 경리업무를잘하는청년들</title>',
    `    <link>${SITE_URL}/news</link>`,
    '    <description>중소기업 대표님을 위한 정책자금·지원금·경리 실무 소식. 원격 경리·경리 아웃소싱 전문 경리업무를잘하는청년들이 정리합니다.</description>',
    '    <language>ko-kr</language>',
    `    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>`,
    `    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

function replaceAutoSection(content, name, body, file) {
  const re = new RegExp(`(<!-- AUTO:${name} START[^>]*-->)[\\s\\S]*?(<!-- AUTO:${name} END -->)`);
  if (!re.test(content)) throw new Error(`${file}: AUTO:${name} markers not found`);
  return content.replace(re, (_, start, end) => `${start}\n${body}\n${end}`);
}

function escapeMarkdownText(text) {
  return String(text).replace(/([\\[\]])/g, '\\$1');
}

function buildLlmsNewsList(newsPages) {
  return newsPages.map(p => `- [${escapeMarkdownText(p.title)} (${p.published})](${p.url})`).join('\n');
}

function buildLlmsFullNews(newsPages) {
  return newsPages.map(p => {
    const lines = [`### ${p.title}`, '', `- 주소: ${p.url}`, `- 분류: ${p.category || '경리소식'} · 작성일: ${p.published}`, '', p.description];
    const faq = p.faq.slice(0, NEWS_FAQ_LIMIT);
    if (faq.length) {
      lines.push('');
      faq.forEach(item => lines.push(`- **Q. ${item.q}** A. ${item.a}`));
    }
    return lines.join('\n');
  }).join('\n\n');
}

function buildLlmsFullCases(cases) {
  if (!cases.length) return '도입사례 데이터가 없습니다.';
  const header = `총 ${cases.length}건 (출처: ${SITE_URL}/reviews?tab=cases)`;
  const items = cases.map(c => {
    const excerpt = stripTags(c.content);
    const short = excerpt.length > CASE_EXCERPT_LENGTH ? `${excerpt.slice(0, CASE_EXCERPT_LENGTH)}…` : excerpt;
    return `- **${oneLine(c.title)}** (${oneLine(c.industry)}${c.subtitle ? ` · ${oneLine(c.subtitle)}` : ''}): ${oneLine(c.summary)}${short ? ` ${short}` : ''}`;
  });
  return [header, '', ...items].join('\n');
}

function writeIfChanged(relativeFile, content) {
  const file = path.join(ROOT_DIR, relativeFile);
  const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (previous === content) return false;
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, file);
  return true;
}

function validateSitemap(xml, pages) {
  const locs = xml.match(/<loc>[^<]+<\/loc>/g) || [];
  if (locs.length !== pages.length) throw new Error(`sitemap has ${locs.length} <loc> but ${pages.length} pages`);
  if (locs.length < MIN_SITEMAP_URLS) throw new Error(`sitemap has only ${locs.length} URLs (minimum ${MIN_SITEMAP_URLS})`);
  if (new Set(locs).size !== locs.length) throw new Error('sitemap contains duplicate URLs');
  if (!locs.includes(`<loc>${SITE_URL}/</loc>`)) throw new Error('sitemap is missing the home page');
}

function main() {
  const hasGit = gitAvailable();
  const shallowBoundary = hasGit ? gitShallowBoundary() : new Set();
  if (shallowBoundary.size) log('shallow clone: pages last changed before the fetched history keep their previous sitemap lastmod');
  const previousLastmods = readPreviousLastmods();
  const newsData = loadNewsData();
  const newsDataBySlug = new Map(newsData.map(p => [p.slug, p]));

  const pages = [];
  for (const file of listHtmlFiles()) {
    try {
      const page = analyzePage(file);
      if (!page.indexable) {
        log(`skip ${file} (${page.robots.includes('noindex') ? 'noindex' : `canonical → ${page.canonical}`})`);
        continue;
      }
      if (!page.hasCanonical) warn(`${file}: no canonical link, using ${page.url}`);
      if (page.isNews) {
        const slug = path.basename(file, '.html');
        const data = newsDataBySlug.get(slug) || {};
        page.published = page.published || isoDate(data.date) || isoDate(slug);
        if (!page.published) { warn(`${file}: no publish date, skipped`); continue; }
        page.title = page.title || oneLine(data.title);
        page.description = page.description || oneLine(data.summary);
        page.category = page.category || oneLine(data.category);
        page.lastmod = page.modified && page.modified > page.published ? page.modified : page.published;
      } else {
        page.lastmod = (hasGit && gitLastModified(file, shallowBoundary)) || previousLastmods.get(page.url) || null;
      }
      pages.push(page);
    } catch (error) {
      warn(`${file}: ${error.message}`);
    }
  }

  const mainPages = pages.filter(p => !p.isNews);
  const newsPages = pages.filter(p => p.isNews)
    .sort((a, b) => b.published.localeCompare(a.published) || b.lastmod.localeCompare(a.lastmod) || a.url.localeCompare(b.url));
  if (!newsPages.length) throw new Error('no news pages found');

  const latest = pages.reduce((max, p) => (p.lastmod && p.lastmod > max ? p.lastmod : max), '');
  const stampUpdated = text => text.replace(/마지막 갱신: \d{4}-\d{2}-\d{2}/, `마지막 갱신: ${latest}`);
  const outputs = [
    ['sitemap.xml', () => {
      const xml = buildSitemap(mainPages, newsPages);
      validateSitemap(xml, pages);
      return xml;
    }],
    ['rss.xml', () => {
      const xml = buildRss(newsPages);
      if ((xml.match(/<item>/g) || []).length !== newsPages.length) throw new Error('rss item count mismatch');
      return xml;
    }],
    ['llms.txt', () => {
      const text = fs.readFileSync(path.join(ROOT_DIR, 'llms.txt'), 'utf8');
      return stampUpdated(replaceAutoSection(text, 'NEWS', buildLlmsNewsList(newsPages), 'llms.txt'));
    }],
    ['llms-full.txt', () => {
      let text = fs.readFileSync(path.join(ROOT_DIR, 'llms-full.txt'), 'utf8');
      text = replaceAutoSection(text, 'NEWS', buildLlmsFullNews(newsPages), 'llms-full.txt');
      text = replaceAutoSection(text, 'CASES', buildLlmsFullCases(loadCaseData()), 'llms-full.txt');
      return stampUpdated(text);
    }],
  ];

  const written = [];
  for (const [file, build] of outputs) {
    try {
      if (writeIfChanged(file, build())) written.push(file);
    } catch (error) {
      console.error(`${LOG_PREFIX} ERROR ${file}: ${error.message} — previous file kept`);
    }
  }

  log(`${mainPages.length} pages + ${newsPages.length} news (git: ${hasGit ? 'yes' : 'no'}); ${written.length ? `updated ${written.join(', ')}` : 'no changes'}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`${LOG_PREFIX} ERROR ${error.stack || error.message} — previous files kept`);
  }
}

module.exports = { SITE_URL, EXCLUDED_FILES, analyzePage, toCleanPath };
