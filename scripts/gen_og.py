#!/usr/bin/env python3
"""페이지별 OG 카드(1200x630) 생성기.
Pretendard 폰트로 한글을 정확히 렌더링한다. (AI 이미지 생성은 한글이 깨지므로 사용하지 않음)
"""
import os
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(BASE, "fonts/Pretendard-1.3.9/public/static")
OUT_DIR = os.path.join(BASE, "assets/og")
os.makedirs(OUT_DIR, exist_ok=True)

W, H = 1200, 630
PAD = 90

def font(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)

# (eyebrow, title, tagline)
CARDS = {
    "home":          ("경리업무를잘하는청년들", "원격 경리 서비스",   "경리대행 · 경리 아웃소싱 · 182개 기업이 선택"),
    "service":       ("업종별 맞춤 경리",       "서비스업 경리",     "프로젝트별 수익 관리 · 미수금 추적"),
    "manufacturing": ("업종별 맞춤 경리",       "제조업 경리",       "제품별 원가 계산 · 재고자산 관리"),
    "construction":  ("업종별 맞춤 경리",       "건설업 경리",       "현장별 비용 관리 · 기성금 정산"),
    "wholesale":     ("업종별 맞춤 경리",       "도소매업 경리",     "재고 관리 · 매입매출 정산"),
    "restaurant":    ("업종별 맞춤 경리",       "음식점 경리",       "메뉴별 손익분석 · 식자재비 관리"),
    "ecommerce":     ("업종별 맞춤 경리",       "쇼핑몰 경리",       "다채널 정산 · 수수료 관리"),
    "faq":           ("자주 묻는 질문",         "무엇이든 물어보세요", "서비스 · 프로그램 · 금액 안내"),
    "reviews":       ("고객 후기",             "182개 기업의 선택",  "대표님들의 생생한 후기"),
    "about":         ("원격경리란?",           "전문 경리팀의 온라인 관리", "경리 직원 유무와 상관없이 회계를 맡깁니다"),
    "news":          ("경리소식",              "정책자금 · 지원금 · 실무", "중소기업 대표님을 위한 경리 뉴스"),
    "all-service":   ("전체 서비스 안내",       "모든 업종 원격 경리",  "월별 손익 보고서 · 자금 관리"),
}

BLUE_TOP = (37, 99, 235)      # #2563eb
BLUE_BOT = (30, 58, 138)      # #1e3a8a
LIGHT = (207, 224, 255)       # tagline color
WHITE = (255, 255, 255)

logo = Image.open(os.path.join(BASE, "logo.png")).convert("RGBA")

def gradient_bg():
    base = Image.new("RGB", (W, H), BLUE_TOP)
    top = BLUE_TOP
    bot = BLUE_BOT
    px = base.load()
    for y in range(H):
        t = y / (H - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        for x in range(W):
            px[x, y] = (r, g, b)
    return base.convert("RGBA")

def fit_font(text, name, start, max_w):
    size = start
    while size > 40:
        f = font(name, size)
        if f.getlength(text) <= max_w:
            return f
        size -= 3
    return font(name, size)

def make_card(key, eyebrow, title, tagline):
    img = gradient_bg()
    d = ImageDraw.Draw(img)

    # 우상단 장식 원 (반투명)
    deco = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(deco)
    dd.ellipse([W - 320, -180, W + 180, 320], fill=(255, 255, 255, 18))
    dd.ellipse([W - 140, 180, W + 260, 580], fill=(255, 255, 255, 12))
    img = Image.alpha_composite(img, deco)
    d = ImageDraw.Draw(img)

    # 좌측 강조 바 + eyebrow 텍스트
    d.rounded_rectangle([PAD, 120, PAD + 64, 133, ], radius=6, fill=(125, 211, 252))
    f_eye = font("Pretendard-SemiBold.otf", 32)
    d.text((PAD + 84, 109), eyebrow, font=f_eye, fill=(186, 213, 255))

    # title (auto-fit)
    f_title = fit_font(title, "Pretendard-Black.otf", 104, W - PAD * 2 - 40)
    d.text((PAD, 232), title, font=f_title, fill=WHITE)
    ty = 232 + f_title.size + 28

    # tagline
    f_tag = fit_font(tagline, "Pretendard-Medium.otf", 42, W - PAD * 2 - 20)
    d.text((PAD, ty), tagline, font=f_tag, fill=LIGHT)

    # 하단: 흰색 칩 + 로고
    chip_h = 84
    chip_y = H - PAD - chip_h + 30
    lw = int(logo.width * (48 / logo.height))
    chip_w = lw + 56
    d.rounded_rectangle([PAD, chip_y, PAD + chip_w, chip_y + chip_h], radius=20, fill=WHITE)
    lg = logo.resize((lw, 48), Image.LANCZOS)
    img.paste(lg, (PAD + 28, chip_y + (chip_h - 48) // 2), lg)

    # 우하단 도메인 / 연락처
    f_url = font("Pretendard-Bold.otf", 32)
    url = "wapeople.kr"
    d.text((W - PAD - f_url.getlength(url), chip_y + 8), url, font=f_url, fill=WHITE)
    f_tel = font("Pretendard-Medium.otf", 26)
    tel = "1566-2687"
    d.text((W - PAD - f_tel.getlength(tel), chip_y + 50), tel, font=f_tel, fill=LIGHT)

    out = os.path.join(OUT_DIR, f"{key}.png")
    img.convert("RGB").save(out, "PNG", optimize=True)
    return out

if __name__ == "__main__":
    for k, (e, t, g) in CARDS.items():
        p = make_card(k, e, t, g)
        print("wrote", os.path.relpath(p, BASE))
