#!/usr/bin/env python3
"""
Generate GAFFER PWA icons as SVG files (renamed as PNG placeholders)
Run: python3 scripts/generate-icons.py
"""
import os

sizes = [72, 96, 128, 144, 152, 192, 384, 512]
output_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
os.makedirs(output_dir, exist_ok=True)

def generate_svg_icon(size):
    font_size = int(size * 0.4)
    radius = size * 0.18
    return f"""<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="{size}" y2="{size}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1A1F2E"/>
      <stop offset="100%" stop-color="#0A0C10"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="{size}" y2="{size}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF6B00"/>
      <stop offset="100%" stop-color="#CC2200"/>
    </linearGradient>
    <clipPath id="rounded">
      <rect width="{size}" height="{size}" rx="{radius}" ry="{radius}"/>
    </clipPath>
  </defs>
  <rect width="{size}" height="{size}" rx="{radius}" fill="url(#bg)"/>
  <text x="{size//2}" y="{size//2 + font_size//3}" 
        font-family="Arial Black, Arial" font-weight="900" 
        font-size="{font_size}" fill="url(#accent)" 
        text-anchor="middle">G</text>
</svg>"""

for size in sizes:
    svg_content = generate_svg_icon(size)
    # Save as SVG (browsers can use SVG as icons too)
    svg_path = os.path.join(output_dir, f'icon-{size}x{size}.svg')
    with open(svg_path, 'w') as f:
        f.write(svg_content)
    print(f'✓ Generated icon-{size}x{size}.svg')

# Update manifest to use SVG icons
print('\n✅ SVG icons generated. Update manifest.json to use .svg extension.')
print('   Or run: npm install canvas && node scripts/generate-icons.js for PNG icons')
