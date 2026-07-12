#!/usr/bin/env python3
"""
Shai Systems — One-Pager PDF Generator
2 pages: Hebrew (RTL) + English (LTR)
Design: Cream #F8F5F0 / Charcoal #1C1C1C / Gold #B8975A
"""
import subprocess, sys, os

def pip_install(pkg):
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', pkg, '-q'])

try:
    from bidi.algorithm import get_display
except ImportError:
    pip_install('python-bidi')
    from bidi.algorithm import get_display

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import mm

# ── Dimensions ──────────────────────────────────────────────────
W, H = A4   # 595 x 842 pt

# ── Brand Colours ───────────────────────────────────────────────
CREAM   = colors.HexColor('#F8F5F0')
CHARCOAL= colors.HexColor('#1C1C1C')
GOLD    = colors.HexColor('#B8975A')
SOFT    = colors.HexColor('#5C5C5C')
WHITE   = colors.white

# ── Fonts ───────────────────────────────────────────────────────
FONT_PATHS = [
    (r'C:\Windows\Fonts\arial.ttf',   r'C:\Windows\Fonts\arialbd.ttf'),
    (r'C:\Windows\Fonts\tahoma.ttf',  r'C:\Windows\Fonts\tahomabd.ttf'),
]
REG, BOLD = 'Helvetica', 'Helvetica-Bold'
for reg_path, bold_path in FONT_PATHS:
    if os.path.exists(reg_path) and os.path.exists(bold_path):
        pdfmetrics.registerFont(TTFont('HebrewReg',  reg_path))
        pdfmetrics.registerFont(TTFont('HebrewBold', bold_path))
        REG, BOLD = 'HebrewReg', 'HebrewBold'
        break

def r(text):
    """Reverse Hebrew string for RTL display in reportlab."""
    return get_display(str(text))

# ── Helper: draw a filled rect ───────────────────────────────────
def fill_rect(c, x, y, w, h, col):
    c.setFillColor(col)
    c.rect(x, y, w, h, fill=1, stroke=0)

# ── Helper: text line ────────────────────────────────────────────
def text_right(c, x, y, txt, font, size, col):
    c.setFont(font, size)
    c.setFillColor(col)
    c.drawRightString(x, y, txt)

def text_left(c, x, y, txt, font, size, col):
    c.setFont(font, size)
    c.setFillColor(col)
    c.drawString(x, y, txt)

def text_center(c, y, txt, font, size, col):
    c.setFont(font, size)
    c.setFillColor(col)
    c.drawCentredString(W / 2, y, txt)

# ── Helper: gold rule ────────────────────────────────────────────
def gold_rule(c, x, y, w):
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.2)
    c.line(x, y, x + w, y)

# ════════════════════════════════════════════════════════════════
# PAGE 1 — HEBREW
# ════════════════════════════════════════════════════════════════
def page_he(c):
    MARGIN = 30
    RX = W - MARGIN   # right edge for RTL text

    # Background
    fill_rect(c, 0, 0, W, H, CREAM)

    # ── Top bar ─────────────────────────────────────────────────
    fill_rect(c, 0, H - 58, W, 58, CHARCOAL)
    fill_rect(c, 0, H - 61, W, 3,  GOLD)

    # Company name
    text_right(c, RX, H - 36, r('שי מערכות חכמות'), BOLD, 20, CREAM)
    text_right(c, RX, H - 52, r('מערכות חכמות לבית ולעסק'), REG, 9, GOLD)

    # ── Tagline ─────────────────────────────────────────────────
    text_right(c, RX, H - 95, r('לשותפות שקטה עם אנשי המקצוע שלכם'), BOLD, 16, GOLD)
    text_right(c, RX, H - 115, r('ייעוץ, תכנון, ביצוע ותמיכה — ספק אחד, שקט נפשי.'), REG, 11, CHARCOAL)

    gold_rule(c, MARGIN, H - 128, W - 2 * MARGIN)

    # ── Intro paragraph ─────────────────────────────────────────
    intro_lines = [
        r('כמעצבת פנים או אדריכלית, את זקוקה לשותף מקצועי שמבין את הפרויקט מהרגע הראשון.'),
        r('אנחנו נכנסים לתהליך כבר בשלב השרטוטים — מייעצים, מתאמים, ומוציאים לפועל'),
        r('בדיוק לפי החזון שלך. תיאום מלא מול הקבלנים, ללא הפתעות בשטח.'),
    ]
    y = H - 152
    for line in intro_lines:
        text_right(c, RX, y, line, REG, 9.5, SOFT)
        y -= 15

    gold_rule(c, MARGIN, y - 8, W - 2 * MARGIN)

    # ── Services (2-col grid) ────────────────────────────────────
    y -= 28
    text_right(c, RX, y, r('מה אנחנו מציעים'), BOLD, 12, CHARCOAL)
    y -= 18

    services = [
        ('מצלמות אבטחה ו-4K',      'אזעקות ומערכות גילוי'),
        ('בית חכם ואוטומציה',       'תקשורת ורשת Cat6/7'),
        ('אינטרקום ובקרת כניסה',    'ייעוץ ואפיון בשלב התכנון'),
    ]

    col_w = (W - 2 * MARGIN - 20) / 2
    for left_svc, right_svc in services:
        # right column (in RTL, right = first)
        fill_rect(c, W - MARGIN - col_w, y - 4, col_w - 6, 22, WHITE)
        c.setStrokeColor(GOLD)
        c.setLineWidth(0.5)
        c.rect(W - MARGIN - col_w, y - 4, col_w - 6, 22, fill=0, stroke=1)
        text_right(c, W - MARGIN - 10, y + 6, r(right_svc), REG, 9, CHARCOAL)

        # left column
        fill_rect(c, MARGIN, y - 4, col_w - 6, 22, WHITE)
        c.rect(MARGIN, y - 4, col_w - 6, 22, fill=0, stroke=1)
        text_right(c, MARGIN + col_w - 12, y + 6, r(left_svc), REG, 9, CHARCOAL)

        y -= 30

    gold_rule(c, MARGIN, y - 6, W - 2 * MARGIN)

    # ── Why Us ───────────────────────────────────────────────────
    y -= 26
    text_right(c, RX, y, r('למה לעבוד איתנו?'), BOLD, 12, CHARCOAL)
    y -= 18

    points = [
        r('ייעוץ חינמי עוד בשלב השרטוטים — לפני שמסמרים גגות'),
        r('500+ פרויקטים בבתים פרטיים, משרדים ועסקים בכל הארץ'),
        r('10+ שנות ניסיון | אחריות מלאה על כל עבודה'),
        r('נשארים זמינים בטלפון ובוואטסאפ גם אחרי שהפרויקט הסתיים'),
        r('פתרון אחד, ספק אחד — ללא תיאום בין קבלנים מרובים'),
    ]
    for pt in points:
        # Gold bullet
        c.setFillColor(GOLD)
        c.setFont(REG, 10)
        c.drawRightString(RX, y, '✓')
        text_right(c, RX - 16, y, pt, REG, 9, CHARCOAL)
        y -= 15

    gold_rule(c, MARGIN, y - 10, W - 2 * MARGIN)

    # ── Quote / Testimonial strip ────────────────────────────────
    y -= 30
    fill_rect(c, MARGIN, y - 22, W - 2 * MARGIN, 44, WHITE)
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.rect(MARGIN, y - 22, W - 2 * MARGIN, 44, fill=0, stroke=1)
    fill_rect(c, MARGIN, y + 12, 4, 22, GOLD)  # left gold accent

    quote = r('"הגב המקצועי שכל מעצבת פנים צריכה — מהשרטוט ועד המפתח"')
    text_right(c, RX - 10, y + 5, quote, REG, 9.5, CHARCOAL)
    text_right(c, RX - 10, y - 12, r('שי מערכות חכמות'), REG, 8, SOFT)

    # ── Contact bar ─────────────────────────────────────────────
    fill_rect(c, 0, 0, W, 60, CHARCOAL)
    fill_rect(c, 0, 60, W, 3, GOLD)

    # 3 contact items centred
    contacts = [
        ('054-9019815', r('טלפון / וואטסאפ')),
        ('info@shaisystems.co.il', r('אימייל')),
        ('www.shaisystems.co.il', r('אתר')),
    ]
    spacing = W / len(contacts)
    for i, (val, label) in enumerate(contacts):
        cx = spacing * i + spacing / 2
        c.setFont(BOLD, 10)
        c.setFillColor(CREAM)
        c.drawCentredString(cx, 36, val)
        c.setFont(REG, 7.5)
        c.setFillColor(GOLD)
        c.drawCentredString(cx, 22, label)

    c.showPage()


# ════════════════════════════════════════════════════════════════
# PAGE 2 — ENGLISH
# ════════════════════════════════════════════════════════════════
def page_en(c):
    MARGIN = 30
    LX = MARGIN

    # Background
    fill_rect(c, 0, 0, W, H, CREAM)

    # ── Top bar ─────────────────────────────────────────────────
    fill_rect(c, 0, H - 58, W, 58, CHARCOAL)
    fill_rect(c, 0, H - 61, W, 3,  GOLD)

    text_left(c, LX, H - 36, 'Shai Smart Systems', BOLD, 20, CREAM)
    text_left(c, LX, H - 52, 'Smart Solutions for Every Home & Office', REG, 9, GOLD)

    # ── Tagline ─────────────────────────────────────────────────
    text_left(c, LX, H - 95, 'The Professional Partner Designers Rely On', BOLD, 16, GOLD)
    text_left(c, LX, H - 115, 'Consultation, planning, execution and support — one provider, total peace of mind.', REG, 10, CHARCOAL)

    gold_rule(c, MARGIN, H - 128, W - 2 * MARGIN)

    # ── Intro paragraph ─────────────────────────────────────────
    intro_lines = [
        'As an interior designer or architect, you need a technical partner who understands',
        'your vision from day one. We join the process at the blueprint stage — advising,',
        'coordinating, and executing precisely to spec. No surprises on site.',
    ]
    y = H - 152
    for line in intro_lines:
        text_left(c, LX, y, line, REG, 9.5, SOFT)
        y -= 15

    gold_rule(c, MARGIN, y - 8, W - 2 * MARGIN)

    # ── Services (2-col grid) ────────────────────────────────────
    y -= 28
    text_left(c, LX, y, 'What We Offer', BOLD, 12, CHARCOAL)
    y -= 18

    services = [
        ('Security Cameras (HD & 4K)',   'Alarms & Detection Systems'),
        ('Smart Home & Automation',      'Networking & Infrastructure'),
        ('Intercom & Access Control',    'Consultation from Blueprint Stage'),
    ]

    col_w = (W - 2 * MARGIN - 20) / 2

    for left_svc, right_svc in services:
        fill_rect(c, MARGIN, y - 4, col_w - 6, 22, WHITE)
        c.setStrokeColor(GOLD)
        c.setLineWidth(0.5)
        c.rect(MARGIN, y - 4, col_w - 6, 22, fill=0, stroke=1)
        text_left(c, MARGIN + 10, y + 6, left_svc, REG, 9, CHARCOAL)

        fill_rect(c, MARGIN + col_w + 14, y - 4, col_w - 6, 22, WHITE)
        c.rect(MARGIN + col_w + 14, y - 4, col_w - 6, 22, fill=0, stroke=1)
        text_left(c, MARGIN + col_w + 24, y + 6, right_svc, REG, 9, CHARCOAL)

        y -= 30

    gold_rule(c, MARGIN, y - 6, W - 2 * MARGIN)

    # ── Why Us ───────────────────────────────────────────────────
    y -= 26
    text_left(c, LX, y, 'Why Partner With Us?', BOLD, 12, CHARCOAL)
    y -= 18

    points = [
        'Free consultation at the blueprint stage — before walls go up',
        '500+ projects in homes, offices and businesses nationwide',
        '10+ years experience | Full warranty on every installation',
        'Reachable by phone and WhatsApp even after project completion',
        'One provider, one point of contact — no contractor juggling',
    ]
    for pt in points:
        c.setFillColor(GOLD)
        c.setFont(REG, 10)
        c.drawString(LX, y, '✓')
        text_left(c, LX + 16, y, pt, REG, 9, CHARCOAL)
        y -= 15

    gold_rule(c, MARGIN, y - 10, W - 2 * MARGIN)

    # ── Quote strip ─────────────────────────────────────────────
    y -= 30
    fill_rect(c, MARGIN, y - 22, W - 2 * MARGIN, 44, WHITE)
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.rect(MARGIN, y - 22, W - 2 * MARGIN, 44, fill=0, stroke=1)
    fill_rect(c, W - MARGIN - 4, y - 10, 4, 22, GOLD)

    text_left(c, LX + 14, y + 5,  '"The professional backbone every designer needs — from blueprint to handover"', REG, 9.5, CHARCOAL)
    text_left(c, LX + 14, y - 12, 'Shai Smart Systems', REG, 8, SOFT)

    # ── Contact bar ─────────────────────────────────────────────
    fill_rect(c, 0, 0, W, 60, CHARCOAL)
    fill_rect(c, 0, 60, W, 3, GOLD)

    contacts = [
        ('054-9019815',             'Phone / WhatsApp'),
        ('info@shaisystems.co.il',  'Email'),
        ('www.shaisystems.co.il',   'Website'),
    ]
    spacing = W / len(contacts)
    for i, (val, label) in enumerate(contacts):
        cx = spacing * i + spacing / 2
        c.setFont(BOLD, 10)
        c.setFillColor(CREAM)
        c.drawCentredString(cx, 36, val)
        c.setFont(REG, 7.5)
        c.setFillColor(GOLD)
        c.drawCentredString(cx, 22, label)

    c.showPage()


# ════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    out = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        'שי מערכות - One Pager.pdf'
    )
    cv = canvas.Canvas(out, pagesize=A4)
    page_he(cv)
    page_en(cv)
    cv.save()
    print(f'PDF saved: {out}')
