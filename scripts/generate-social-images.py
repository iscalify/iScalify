"""Regenerate the committed brand cards with Pillow (not required for a site build)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets' / 'social'
FONT = Path('/usr/share/fonts/truetype/dejavu')

def font(size, bold=False):
    return ImageFont.truetype(str(FONT / ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')), size)

def card(name, category, lines, footer):
    image = Image.new('RGB', (1200, 630), '#08080e')
    draw = ImageDraw.Draw(image)
    for x in range(880, 1200, 80):
        draw.line((x, 0, x - 210, 630), fill='#202031', width=1)
    draw.rectangle((0, 0, 15, 630), fill='#b8befe')
    draw.text((70, 48), 'ISCALIFY', font=font(32, True), fill='#f0f0f8')
    draw.text((70, 143), category.upper(), font=font(19, True), fill='#b8befe')
    for index, line in enumerate(lines):
        draw.text((66, 205 + index * 93), line, font=font(65, True), fill='#f0f0f8')
    draw.line((70, 490, 1130, 490), fill='#3e3e54', width=1)
    draw.text((70, 525), footer, font=font(20), fill='#c8c8d8')
    draw.text((935, 572), 'iscalify.com', font=font(21, True), fill='#b8befe')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT / f'{name}.png', optimize=True)

card('iscalify', 'Performance marketing agency', ['Performance marketing.', 'Built for real growth.'], 'Meta Ads  /  Google Ads  /  SEO  /  Web Development')
card('meta-ads-budget-india', 'Meta Ads budget guide', ['Plan your', 'Meta Ads budget'], 'Budget scenarios  /  Acquisition costs  /  Testing')
card('d2c-brand-meta-ads-not-profitable', 'D2C growth guide', ['7 checks for', 'profitable Meta Ads'], 'Message match  /  Creative  /  Offers  /  Conversion')
card('lead-ads-vs-website-leads', 'Lead generation guide', ['Lead forms or', 'website leads?'], 'Compare qualified leads and cost per customer')
logo = Image.new('RGB', (600, 160), '#08080e')
draw = ImageDraw.Draw(logo)
draw.text((34, 28), 'ISCALIFY', font=font(77, True), fill='#f0f0f8')
draw.rectangle((35, 131, 562, 137), fill='#b8befe')
logo.save(ROOT / 'assets' / 'iscalify-logo.png', optimize=True)
print('Generated four 1200 × 630 social cards and the organization logo.')
