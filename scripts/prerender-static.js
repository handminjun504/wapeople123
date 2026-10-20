/**
 * Build-time prerender of lists that the pages otherwise draw only with JavaScript,
 * so crawlers that don't execute JS (most AI crawlers, basic Naver collection) can read them.
 *
 *   news.html    #newsGrid, #newsTotal  ← news-data.js (its own renderer is executed in a sandbox)
 *   reviews.html #caseGrid, #caseCount  ← case-data.js (markup mirrors renderCaseStudies() in reviews.html)
 *
 * The client scripts still re-render identical markup on load. Never fails the build:
 * on error the page is left untouched and an `[prerender-static] ERROR` line is logged.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const LOG_PREFIX = '[prerender-static]';

function readFile(relativeFile) {
  return fs.readFileSync(path.join(ROOT_DIR, relativeFile), 'utf8');
}

function writeIfChanged(relativeFile, content) {
  const file = path.join(ROOT_DIR, relativeFile);
  if (fs.readFileSync(file, 'utf8') === content) return false;
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, file);
  return true;
}

function injectIntoElement(html, id, name, content, file) {
  const open = new RegExp(`<div id="${id}"[^>]*>`).exec(html);
  if (!open) throw new Error(`${file}: <div id="${id}"> not found`);
  const start = open.index + open[0].length;
  const startMarker = `<!-- PRERENDER:${name} START -->`;
  const endMarker = `<!-- PRERENDER:${name} END -->`;
  const block = `${startMarker}${content}${endMarker}`;
  if (html.startsWith(startMarker, start)) {
    const end = html.indexOf(endMarker, start);
    if (end < 0) throw new Error(`${file}: ${endMarker} missing`);
    return html.slice(0, start) + block + html.slice(end + endMarker.length);
  }
  if (html.startsWith('</div>', start)) return html.slice(0, start) + block + html.slice(start);
  throw new Error(`${file}: #${id} has unexpected content, refusing to overwrite`);
}

function setText(html, pattern, text, file) {
  if (!pattern.test(html)) throw new Error(`${file}: ${pattern} not found`);
  return html.replace(pattern, (_, open, close) => `${open}${text}${close}`);
}

function renderNewsList() {
  const noop = () => {};
  const element = () => ({ innerHTML: '', textContent: '', value: '', style: {}, classList: { add: noop, remove: noop }, addEventListener: noop });
  const elements = { newsGrid: element(), newsEmpty: element(), newsTotal: element(), newsSearch: element() };
  const context = {
    window: {},
    document: { readyState: 'complete', getElementById: id => elements[id] || null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop },
  };
  vm.runInNewContext(readFile('news-data.js'), context, { filename: 'news-data.js', timeout: 2000 });
  const posts = context.window.WA_NEWS_DATA;
  if (!Array.isArray(posts) || !posts.length) throw new Error('news-data.js has no posts');
  const html = elements.newsGrid.innerHTML;
  const cardCount = (html.match(/class="news-card /g) || []).length;
  if (cardCount !== posts.length) throw new Error(`news-data.js rendered ${cardCount} cards for ${posts.length} posts`);
  return { html, total: String(elements.newsTotal.textContent) };
}

function renderCaseCards(cases) {
  return cases.map(c => {
    let html = `<div class="case-card bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer" data-industry="${c.industry}" onclick="toggleCase(this)">`;
    html += '<div class="p-5 md:p-7">';
    html += '<div class="flex items-start gap-4 mb-3">';
    html += `<div class="w-11 h-11 rounded-xl bg-${c.industryColor}-100 flex items-center justify-center flex-shrink-0 text-xl">${c.emoji}</div>`;
    html += '<div class="min-w-0 flex-1">';
    html += `<span class="text-xs font-bold text-${c.industryColor}-600 bg-${c.industryColor}-50 px-2 py-1 rounded-full">${c.industry}</span>`;
    html += `<h3 class="text-base md:text-lg font-bold text-gray-900 mt-1.5 leading-snug">${c.title}</h3>`;
    if (c.subtitle) html += `<p class="text-xs text-gray-500 mt-1">${c.subtitle}</p>`;
    html += '</div>';
    html += '<i class="fas fa-chevron-down text-gray-400 ml-auto flex-shrink-0 case-icon transition-transform text-sm mt-1"></i>';
    html += '</div>';
    html += `<p class="text-gray-600 leading-relaxed text-sm line-clamp-2">${c.summary}</p>`;
    html += '</div>';
    html += '<div class="case-detail hidden border-t border-gray-100 bg-gray-50 p-5 md:p-7">';
    if (c.image) {
      (Array.isArray(c.image) ? c.image : [c.image]).forEach(src => {
        html += `<div class="mb-5"><img src="${encodeURI(src)}" alt="${c.title} 도입사례 사진" class="w-full max-h-96 object-contain rounded-xl border border-gray-200" loading="lazy"></div>`;
      });
    }
    html += `<div class="prose max-w-none text-gray-700 text-sm md:text-base leading-relaxed space-y-3">${c.content}</div>`;
    html += '</div>';
    html += '</div>';
    return html;
  }).join('');
}

function loadCases() {
  const context = { window: {} };
  vm.runInNewContext(readFile('case-data.js'), context, { filename: 'case-data.js', timeout: 2000 });
  const cases = context.window.WA_CASE_DATA;
  if (!Array.isArray(cases) || !cases.length) throw new Error('case-data.js has no cases');
  return cases;
}

const TASKS = [
  ['news.html', html => {
    const { html: cards, total } = renderNewsList();
    html = injectIntoElement(html, 'newsGrid', 'NEWS', cards, 'news.html');
    return setText(html, /(<span id="newsTotal"[^>]*>)[^<]*(<\/span>)/, total, 'news.html');
  }],
  ['reviews.html', html => {
    const cases = loadCases();
    html = injectIntoElement(html, 'caseGrid', 'CASES', renderCaseCards(cases), 'reviews.html');
    return setText(html, /(<p [^>]*id="caseCount"[^>]*>)[^<]*(<\/p>)/, `총 ${cases.length}건의 도입사례`, 'reviews.html');
  }],
];

for (const [file, transform] of TASKS) {
  try {
    const changed = writeIfChanged(file, transform(readFile(file)));
    console.log(`${LOG_PREFIX} ${file}: ${changed ? 'updated' : 'no changes'}`);
  } catch (error) {
    console.error(`${LOG_PREFIX} ERROR ${error.stack || error.message} — ${file} left untouched`);
  }
}
