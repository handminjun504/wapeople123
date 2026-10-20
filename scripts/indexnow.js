/**
 * Notifies IndexNow (Bing, Naver and the other participating engines share submissions)
 * about pages changed by a production deployment.
 *
 * Run by .github/workflows/indexnow.yml when Vercel reports a successful Production
 * deployment to GitHub. Submitted URLs = pages changed between the previous successful
 * production deployment and this one (deleted pages included so engines drop them),
 * plus list pages whose prerendered content depends on changed data files.
 *
 * Env:
 *   GITHUB_TOKEN, GITHUB_REPOSITORY, DEPLOYMENT_ID, DEPLOYMENT_SHA  (set by the workflow)
 *   INDEXNOW_PATHS     space/comma separated paths to submit instead of the git diff (manual run)
 *   INDEXNOW_BASE_SHA  compare against this commit instead of the previous deployment
 *   DRY_RUN=1          print what would be submitted, no network calls
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { SITE_URL, EXCLUDED_FILES, analyzePage, toCleanPath } = require('./generate-seo-files');

const ROOT_DIR = path.resolve(__dirname, '..');
const HOST = new URL(SITE_URL).host;
const ENDPOINTS = ['https://api.indexnow.org/indexnow', 'https://searchadvisor.naver.com/indexnow'];
const DATA_DEPENDENCIES = [
  [/^news-data\.js$/, ['/news']],
  [/^case-data\.js$/, ['/reviews', '/']],
  [/^gnrl\//, ['/reviews', '/']],
];
const MAX_URLS = 10000;
const REQUEST_TIMEOUT_MS = 20000;
const SUBMIT_ATTEMPTS = 3;
const KEY_CHECK_ATTEMPTS = 12;
const KEY_CHECK_DELAY_MS = 10000;

const dryRun = process.env.DRY_RUN === '1';
const log = message => console.log(`[indexnow] ${message}`);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const annotate = (level, message) => console.log(`::${level}::${message}`);

function findKey() {
  const keys = fs.readdirSync(ROOT_DIR)
    .filter(name => /^[0-9a-f]{32}\.txt$/.test(name))
    .filter(name => fs.readFileSync(path.join(ROOT_DIR, name), 'utf8').trim() === name.slice(0, -4))
    .map(name => name.slice(0, -4));
  if (keys.length !== 1) throw new Error(`expected exactly one IndexNow key file at the repo root, found ${keys.length}`);
  return keys[0];
}

async function githubApi(pathname) {
  const { GITHUB_TOKEN } = process.env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not set');
  const res = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'wapeople-indexnow',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`GitHub API ${pathname} → HTTP ${res.status}`);
  return res.json();
}

async function findPreviousDeploymentSha(repo, deploymentId) {
  const deployments = await githubApi(`/repos/${repo}/deployments?environment=Production&per_page=30`);
  const currentIndex = deployments.findIndex(d => String(d.id) === String(deploymentId));
  if (currentIndex < 0) throw new Error(`deployment ${deploymentId} not found in the last 30 Production deployments`);
  for (const deployment of deployments.slice(currentIndex + 1)) {
    const [latest] = await githubApi(`/repos/${repo}/deployments/${deployment.id}/statuses?per_page=1`);
    if (latest && latest.state === 'success') return deployment.sha;
  }
  return null;
}

function git(args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function changedFiles(baseSha, headSha) {
  const fields = git(['diff', '--name-status', '-M', '-z', baseSha, headSha]).split('\0').filter(Boolean);
  const changes = [];
  for (let i = 0; i < fields.length;) {
    const status = fields[i++];
    if (status.startsWith('R') || status.startsWith('C')) {
      const from = fields[i++];
      const to = fields[i++];
      if (status.startsWith('R')) changes.push({ status: 'D', file: from });
      changes.push({ status: 'A', file: to });
    } else {
      changes.push({ status: status[0], file: fields[i++] });
    }
  }
  return changes;
}

function isPageFile(file) {
  return /^(?:(?:manual|news)\/)?[^/]+\.html$/.test(file)
    && !path.basename(file).startsWith('.')
    && !EXCLUDED_FILES.has(file);
}

const withoutAssetVersions = html => html.replace(/\?v=[\w.-]+/g, '');

function urlsFromChanges(changes, baseSha, headSha) {
  const urls = new Set();
  for (const { status, file } of changes) {
    if (isPageFile(file)) {
      if (status === 'D') {
        urls.add(SITE_URL + toCleanPath(file));
      } else {
        try {
          const html = git(['show', `${headSha}:${file}`]);
          if (status === 'M' && withoutAssetVersions(git(['show', `${baseSha}:${file}`])) === withoutAssetVersions(html)) {
            log(`skip ${file} (only asset ?v= changed)`);
            continue;
          }
          const page = analyzePage(file, html);
          if (page.indexable) urls.add(page.url);
          else log(`skip ${file} (not indexable)`);
        } catch (error) {
          annotate('warning', `skip ${file}: ${error.message}`);
        }
      }
    }
    for (const [pattern, paths] of DATA_DEPENDENCIES) {
      if (pattern.test(file)) paths.forEach(p => urls.add(SITE_URL + p));
    }
  }
  return [...urls];
}

function urlsFromPaths(input) {
  return input.split(/[\s,]+/).filter(Boolean).map(p => {
    if (!p.startsWith('/')) throw new Error(`path must start with "/": ${p}`);
    const url = new URL(p, SITE_URL);
    return url.pathname === '/' ? url.href : url.href.replace(/\/$/, '');
  });
}

async function resolveUrls() {
  if (process.env.INDEXNOW_PATHS && process.env.INDEXNOW_PATHS.trim()) {
    log('using INDEXNOW_PATHS');
    return urlsFromPaths(process.env.INDEXNOW_PATHS);
  }
  const headSha = process.env.DEPLOYMENT_SHA || git(['rev-parse', 'HEAD']).trim();
  let baseSha = process.env.INDEXNOW_BASE_SHA || null;
  if (!baseSha) {
    try {
      baseSha = await findPreviousDeploymentSha(process.env.GITHUB_REPOSITORY, process.env.DEPLOYMENT_ID);
    } catch (error) {
      annotate('warning', `previous deployment lookup failed (${error.message}); comparing with the parent commit`);
    }
  }
  baseSha = git(['rev-parse', '--verify', `${baseSha || `${headSha}~1`}^{commit}`]).trim();
  log(`changes ${baseSha.slice(0, 7)}..${headSha.slice(0, 7)}`);
  return urlsFromChanges(changedFiles(baseSha, headSha), baseSha, headSha);
}

async function waitForKeyFile(key) {
  const url = `${SITE_URL}/${key}.txt`;
  for (let attempt = 1; attempt <= KEY_CHECK_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      const body = res.ok ? (await res.text()).trim() : '';
      if (body === key) return;
      log(`key file not live yet (HTTP ${res.status}), attempt ${attempt}/${KEY_CHECK_ATTEMPTS}`);
    } catch (error) {
      log(`key file check failed (${error.message}), attempt ${attempt}/${KEY_CHECK_ATTEMPTS}`);
    }
    if (attempt < KEY_CHECK_ATTEMPTS) await sleep(KEY_CHECK_DELAY_MS);
  }
  throw new Error(`${url} did not serve the key`);
}

async function submit(endpoint, payload) {
  for (let attempt = 1; attempt <= SUBMIT_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const detail = (await res.text()).slice(0, 300).replace(/\s+/g, ' ').trim();
      if (res.status === 200 || res.status === 202) return { ok: true, status: res.status };
      if (res.status === 429) return { ok: true, status: res.status, warning: 'rate limited (429), not retried' };
      if (res.status < 500) return { ok: false, status: res.status, detail };
      log(`${endpoint} → HTTP ${res.status}, attempt ${attempt}/${SUBMIT_ATTEMPTS}`);
    } catch (error) {
      log(`${endpoint} → ${error.message}, attempt ${attempt}/${SUBMIT_ATTEMPTS}`);
    }
    if (attempt < SUBMIT_ATTEMPTS) await sleep(2000 * 2 ** (attempt - 1));
  }
  return { ok: false, status: 'no response', detail: `gave up after ${SUBMIT_ATTEMPTS} attempts` };
}

async function main() {
  const key = findKey();
  const urls = await resolveUrls();
  if (!urls.length) {
    log('no indexable page changes, nothing to submit');
    return;
  }
  if (urls.length > MAX_URLS) throw new Error(`${urls.length} URLs exceed the IndexNow limit of ${MAX_URLS}`);
  log(`${urls.length} URL(s):\n  ${urls.join('\n  ')}`);

  const payload = { host: HOST, key, keyLocation: `${SITE_URL}/${key}.txt`, urlList: urls };
  if (dryRun) {
    log(`DRY_RUN: would POST to ${ENDPOINTS.join(', ')}`);
    return;
  }

  await waitForKeyFile(key);
  let failed = 0;
  for (const endpoint of ENDPOINTS) {
    const result = await submit(endpoint, payload);
    if (result.warning) annotate('warning', `${endpoint}: ${result.warning}`);
    if (result.ok) {
      log(`${endpoint} → HTTP ${result.status}`);
    } else {
      failed++;
      annotate('error', `${endpoint} → ${result.status}${result.detail ? `: ${result.detail}` : ''}`);
    }
  }
  if (failed) process.exitCode = 1;
}

main().catch(error => {
  annotate('error', `IndexNow submission aborted: ${error.message}`);
  process.exitCode = 1;
});
