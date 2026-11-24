// 광고 클릭으로 처음 들어온 방문자만 V2_SPLIT_PERCENT(%) 비율로 v2 를 보여 준다. 주소창은 wapeople.kr 그대로(rewrite).
// 한 번 배정되면 쿠키로 30일 같은 쪽을 본다. 광고가 아닌 방문자·검색 로봇은 항상 v1.
// 끄기: V2_SPLIT_PERCENT 를 0 으로(또는 삭제) 바꾸고 재배포 → 쿠키와 관계없이 전원 v1.
import { next, rewrite } from '@vercel/functions/middleware'

const V2_ORIGIN = 'https://wapeople-v2.vercel.app'
const COOKIE_NAME = 'wp_site'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const AD_CLICK_PARAMS = ['gclid', 'gbraid', 'wbraid', 'gad_source']
// v2 에 없는 v1 전용 페이지. v2 를 보던 사람도 여기서는 v1 을 본다.
const V1_ONLY_PATH = /^\/(lp-remote|manual|gnrl)(\/|\.html|$)/
const BOT_UA = /bot|crawl|spider|slurp|yeti|daum|facebookexternalhit|lighthouse|headless|preview/i

export const config = {
  matcher: ['/((?!api/|admin|_vercel).*)'],
}

function splitPercent() {
  const raw = process.env.V2_SPLIT_PERCENT
  if (!raw) return 0
  const value = Number(raw)
  if (!Number.isFinite(value)) {
    console.error(JSON.stringify({ event: 'split_config_invalid', value: raw }))
    return 0
  }
  return Math.min(100, Math.max(0, value))
}

function assignedSite(request) {
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [name, value] = part.trim().split('=')
    if (name === COOKIE_NAME && (value === 'v1' || value === 'v2')) return value
  }
  return null
}

function isAdLanding(request, url) {
  if (request.method !== 'GET') return false
  if (!(request.headers.get('accept') || '').includes('text/html')) return false
  if (BOT_UA.test(request.headers.get('user-agent') || '')) return false
  return AD_CLICK_PARAMS.some((param) => url.searchParams.has(param))
}

function toV2(url, extraHeaders = {}) {
  return rewrite(new URL(url.pathname + url.search, V2_ORIGIN), {
    headers: { 'x-wp-site': 'v2', ...extraHeaders },
  })
}

export default function middleware(request) {
  try {
    const percent = splitPercent()
    if (percent === 0) return next()

    const url = new URL(request.url)
    if (V1_ONLY_PATH.test(url.pathname)) return next()

    const site = assignedSite(request)
    if (site === 'v2') return toV2(url)
    if (site === 'v1' || !isAdLanding(request, url)) return next()

    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
    const picked = random * 100 < percent ? 'v2' : 'v1'
    const setCookie = `${COOKIE_NAME}=${picked}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`
    console.log(JSON.stringify({ event: 'split_assign', site: picked, percent, path: url.pathname }))
    return picked === 'v2' ? toV2(url, { 'set-cookie': setCookie }) : next({ headers: { 'set-cookie': setCookie } })
  } catch (error) {
    console.error(JSON.stringify({
      event: 'split_error',
      url: request.url,
      message: error instanceof Error ? error.message : String(error),
    }))
    return next()
  }
}
