from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()

# ── Page margins ──────────────────────────────────────────────────────────────
section = doc.sections[0]
section.page_width  = Inches(8.27)   # A4
section.page_height = Inches(11.69)
for attr in ('left_margin','right_margin','top_margin','bottom_margin'):
    setattr(section, attr, Cm(2.5))

# ── Helper colours ────────────────────────────────────────────────────────────
GREEN  = RGBColor(0x16, 0x61, 0x34)   # dark green
GOLD   = RGBColor(0xCA, 0x8A, 0x04)   # amber/gold
RED    = RGBColor(0xDC, 0x26, 0x26)
ORANGE = RGBColor(0xEA, 0x58, 0x0C)
YELLOW = RGBColor(0xCA, 0x8A, 0x04)
BLUE   = RGBColor(0x15, 0x59, 0xBF)
GRAY   = RGBColor(0x6B, 0x72, 0x80)
WHITE  = RGBColor(0xFF, 0xFF, 0xFF)
BLACK  = RGBColor(0x11, 0x18, 0x27)

def set_cell_bg(cell, hex_color):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  hex_color)
    tcPr.append(shd)

def heading(text, level=1, color=GREEN, size=18, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT):
    p   = doc.add_paragraph()
    p.alignment = align
    run = p.add_run(text)
    run.bold      = bold
    run.font.size = Pt(size)
    run.font.color.rgb = color
    return p

def body(text, size=11, color=BLACK, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT):
    p   = doc.add_paragraph()
    p.alignment = align
    run = p.add_run(text)
    run.font.size      = Pt(size)
    run.font.color.rgb = color
    run.bold   = bold
    run.italic = italic
    return p

def bullet(text, size=11, color=BLACK):
    p   = doc.add_paragraph(style='List Bullet')
    run = p.add_run(text)
    run.font.size      = Pt(size)
    run.font.color.rgb = color
    return p

def divider():
    p   = doc.add_paragraph('─' * 80)
    run = p.runs[0]
    run.font.color.rgb = RGBColor(0xD1, 0xD5, 0xDB)
    run.font.size      = Pt(9)
    return p

def spacer(n=1):
    for _ in range(n):
        doc.add_paragraph('')

# ══════════════════════════════════════════════════════════════════════════════
# TITLE PAGE
# ══════════════════════════════════════════════════════════════════════════════
spacer(3)
heading('KRISHI VIKAS UDYOG', level=1, color=GREEN,  size=26, align=WD_ALIGN_PARAGRAPH.CENTER)
heading('International Website Improvement Plan',     color=GOLD,  size=18, align=WD_ALIGN_PARAGRAPH.CENTER)
body('Expert Deep Analysis & Prioritised Recommendations', size=12, color=GRAY, italic=True, align=WD_ALIGN_PARAGRAPH.CENTER)
spacer()
body('Prepared by: Antigravity AI Assistant', size=10, color=GRAY, align=WD_ALIGN_PARAGRAPH.CENTER)
body(f'Date: June 2025', size=10, color=GRAY, align=WD_ALIGN_PARAGRAPH.CENTER)
spacer(4)
divider()
doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — CURRENT ASSESSMENT
# ══════════════════════════════════════════════════════════════════════════════
heading('1. Current Website Assessment', size=16, color=GREEN)
spacer()

tbl = doc.add_table(rows=1, cols=3)
tbl.style = 'Table Grid'
hdr = tbl.rows[0].cells
for i, txt in enumerate(['Area', 'Current Status', 'Score']):
    hdr[i].text = txt
    hdr[i].paragraphs[0].runs[0].bold = True
    hdr[i].paragraphs[0].runs[0].font.color.rgb = WHITE
    set_cell_bg(hdr[i], '166134')

rows_data = [
    ('Design & UI',              '✅ Premium, Modern',   '9/10'),
    ('Mobile Responsiveness',    '✅ Good',              '8/10'),
    ('Multi-language (EN/HI)',   '✅ Implemented',       '7/10'),
    ('International Readiness',  '⚠️ Partial',           '4/10'),
    ('Export / B2B Focus',       '❌ Missing',           '2/10'),
    ('Trust & Credibility',      '⚠️ Basic',             '5/10'),
    ('Lead Capture',             '⚠️ Basic',             '5/10'),
    ('SEO (International)',      '❌ Missing',           '2/10'),
    ('Contact / Communication',  '⚠️ Limited',           '4/10'),
    ('Technical Specifications', '⚠️ Partial',           '5/10'),
]
for area, status, score in rows_data:
    r = tbl.add_row().cells
    r[0].text = area
    r[1].text = status
    r[2].text = score
    r[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

spacer(2)
doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# PRIORITIES
# ══════════════════════════════════════════════════════════════════════════════
priorities = [
    {
        'badge': '🔴 PRIORITY 1 — Critical (Turant Karna Zaroori)',
        'color': RED,
        'items': [
            ('1.1 WhatsApp Floating Button',
             'International buyers (Nepal, Bangladesh, UAE, Africa) WhatsApp se hi contact karte hain. '
             'Sticky button screen ke neeche-daayein corner mein add karein. '
             'Click karne par wa.me/+919415139838 khule. Mobile aur Desktop dono par dikhe.'),
            ('1.2 Country Code Dropdown (Wapas Laana)',
             'Fixed +91 sirf Indian customers ke liye sahi hai. Export customers ke liye yeh problem hai. '
             'Contact aur Dealership dono forms mein +91, +977 (Nepal), +880 (Bangladesh), +971 (UAE), +1 (US/Canada) add karein.'),
            ('1.3 "Country" Field in Both Forms',
             'Aapko pata nahi chal raha kaun sa desh se inquiry aa rahi hai. '
             'Ek dropdown field add karein: Select Country. '
             'Isse aap export market samajh sakte hain aur EmailJS template mein bhi yeh information aayegi.'),
        ]
    },
    {
        'badge': '🟠 PRIORITY 2 — High Impact (Jaldi Karna Chahiye)',
        'color': ORANGE,
        'items': [
            ('2.1 Export Banner / Section on Homepage',
             'Website abhi sirf domestic feel deti hai. "We Export" kuch nahi likha. '
             '"We Export To" section banayein jismein flag icons ke sath countries dikhayein: '
             '🇮🇳 India, 🇳🇵 Nepal, 🇧🇩 Bangladesh, 🇦🇪 UAE, 🇰🇪 Africa.'),
            ('2.2 Certifications & Trust Badges',
             'International buyers certificates/quality marks dekhna chahte hain. '
             'ISO 9001:2015 badge prominently dikhayein. "Est. 1983 — 40+ Years" badge hero section mein bold karein. '
             '"GST Registered" aur "MSME Registered" badges footer mein.'),
            ('2.3 Product Pages — Technical Specifications',
             'Export buyers technical details mein interested hote hain. '
             'Dimensions (L×W×H in mm), Weight (kg), Power (kW/HP both units), '
             'Voltage (380V/415V 3-phase), Output capacity (tons/hour), Download Brochure (PDF) button.'),
            ('2.4 Dedicated "Export" Page',
             'International buyers ek dedicated page chahte hain. '
             'Export process explain karein (Inquiry → Quote → Payment → Shipping). '
             'FOB/CIF pricing, Port of loading (Nhava Sheva/Kolkata), Packaging & shipping details.'),
        ]
    },
    {
        'badge': '🟡 PRIORITY 3 — Medium Impact (1–2 Hafte Mein)',
        'color': YELLOW,
        'items': [
            ('3.1 Language Expansion',
             'Abhi sirf English aur Hindi hai. Add karein: Arabic (UAE, Middle East), '
             'Nepali (bada export market), Bengali (Bangladesh), French (West Africa).'),
            ('3.2 Video Section',
             'Machine ka actual video dekh kar buyers confident hote hain. '
             'YouTube embed ya hosted video, machine working demonstration, factory tour, testimonial videos.'),
            ('3.3 Currency Display',
             'International buyers USD/AED mein sochte hain. '
             'Product page mein "Request for Quote" ke saath USD approximate range dikhana ya currency converter widget.'),
            ('3.4 Live Chat / WhatsApp Widget',
             'Instant response international buyers ka trust badhata hai. '
             'Tawk.to ya Crisp.chat (free) integrate karein. Working hours IST timezone ke saath mention karein.'),
        ]
    },
    {
        'badge': '🟢 PRIORITY 4 — Enhancement (Long Term)',
        'color': GREEN,
        'items': [
            ('4.1 Customer Testimonials Section',
             '3–5 testimonials (naam, company, country ke saath). Star ratings. Export customer testimonials alag section mein.'),
            ('4.2 Case Studies / Success Stories',
             '"Rice Mill Setup in Nepal" jaise story format mein. Actual customers ka experience page.'),
            ('4.3 Blog / Knowledge Center',
             '"How to Choose a Rice Mill" jaise articles. SEO ke liye helpful. International buyers ko educate karta hai.'),
            ('4.4 Dealer Network Map',
             'India ka interactive map jismein distributors dikhein. Export countries bhi highlight hon.'),
        ]
    },
    {
        'badge': '🔵 PRIORITY 5 — Technical SEO',
        'color': BLUE,
        'items': [
            ('5.1 Meta Tags & Schema Markup',
             'Har page ke liye unique title aur description. Product schema (structured data). Organization schema.'),
            ('5.2 Sitemap & Robots.txt',
             'Automatic sitemap generate karein. Google Search Console mein submit karein.'),
            ('5.3 Page Speed Optimization',
             'Images WebP format (already partially done). Lazy loading (already implemented). Bundle size optimize.'),
            ('5.4 hreflang Tags',
             'Multiple languages hain toh hreflang zaruri hai. Google ko bata dein kaun sa page kaun si language ke liye hai.'),
        ]
    },
]

for pri in priorities:
    heading(pri['badge'], size=14, color=pri['color'])
    spacer()
    for title, desc in pri['items']:
        body('● ' + title, size=12, color=BLACK, bold=True)
        body(desc, size=11, color=GRAY)
        spacer()
    divider()
    spacer()

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# QUICK WINS
# ══════════════════════════════════════════════════════════════════════════════
heading('Quick Wins — Bina Code Change Ke', size=14, color=GREEN)
spacer()
quick_wins = [
    'Google Business Profile complete karein — international buyers verify karte hain',
    'IndiaMART / TradeIndia listing update karein — export leads aate hain',
    'Alibaba.com free listing — global buyers find karte hain',
    'LinkedIn Company Page — B2B buyers LinkedIn use karte hain',
    'Export Promotion Council registration (EEPC India)',
]
for q in quick_wins:
    bullet(q)

spacer(2)
divider()
spacer()

# ══════════════════════════════════════════════════════════════════════════════
# TIMELINE
# ══════════════════════════════════════════════════════════════════════════════
heading('Recommended Implementation Timeline', size=14, color=GREEN)
spacer()

tbl2 = doc.add_table(rows=1, cols=2)
tbl2.style = 'Table Grid'
for i, txt in enumerate(['Timeframe', 'Tasks']):
    tbl2.rows[0].cells[i].text = txt
    tbl2.rows[0].cells[i].paragraphs[0].runs[0].bold = True
    tbl2.rows[0].cells[i].paragraphs[0].runs[0].font.color.rgb = WHITE
    set_cell_bg(tbl2.rows[0].cells[i], '166134')

timeline = [
    ('Week 1',   'Priority 1 — WhatsApp button, Country Code Dropdown, Country Field in forms'),
    ('Week 2',   'Priority 2.1 + 2.2 — Export banner on Homepage + Trust/Certification badges'),
    ('Week 3',   'Priority 2.3 + 2.4 — Detailed product specs + Dedicated Export page'),
    ('Month 2',  'Priority 3 — Language expansion, Video section, Live chat widget'),
    ('Month 3',  'Priority 4 + 5 — Testimonials, Case studies, Technical SEO'),
]
for time, task in timeline:
    r = tbl2.add_row().cells
    r[0].text = time
    r[1].text = task
    r[0].paragraphs[0].runs[0].bold = True

spacer(2)
divider()
spacer()

# ══════════════════════════════════════════════════════════════════════════════
# EXPERT NOTE
# ══════════════════════════════════════════════════════════════════════════════
heading('Expert Note', size=13, color=GOLD)
note = (
    'Ek achi export website ki sabse badi pehchaan yeh hoti hai ki buyer ko pehle 10 second mein '
    'samajh aa jaye — "Yeh log export karte hain, trusted hain, aur mujhse contact karna aasan hai." '
    'Abhi website mein pehli do cheezein missing hain. '
    'WhatsApp button aur "We Export" section yeh gap turant bharta hai. '
    'Baaki improvements step-by-step karke website ko world-class export portal banaya ja sakta hai.'
)
body(note, size=11, color=BLACK, italic=True)

# ── Save ──────────────────────────────────────────────────────────────────────
output = '/home/safwan/Desktop/KVU_Website_Improvement_Plan.docx'
doc.save(output)
print(f'✅ Word file saved: {output}')
