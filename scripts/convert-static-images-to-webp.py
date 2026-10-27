"""Create high-quality WebP variants for static site imagery.

PWA icons intentionally stay PNG: the web app manifest references them directly.
Run with: python scripts/convert-static-images-to-webp.py
"""

from pathlib import Path

from PIL import Image


PUBLIC = Path(__file__).resolve().parents[1] / 'public'
SOURCE_FORMATS = {'.png', '.jpg', '.jpeg'}


def convert(source: Path) -> tuple[int, int]:
    target = source.with_suffix('.webp')
    with Image.open(source) as image:
        if image.mode not in ('RGB', 'RGBA'):
            image = image.convert('RGBA' if 'transparency' in image.info else 'RGB')
        image.save(
            target,
            'WEBP',
            quality=82,
            method=6,
            alpha_quality=85,
            exact=True,
        )
    return source.stat().st_size, target.stat().st_size


def main() -> None:
    converted = 0
    original_size = 0
    webp_size = 0
    for source in PUBLIC.rglob('*'):
        if not source.is_file() or source.suffix.lower() not in SOURCE_FORMATS:
            continue
        if 'icons' in source.relative_to(PUBLIC).parts:
            continue
        before, after = convert(source)
        converted += 1
        original_size += before
        webp_size += after

    reduction = 0 if not original_size else (1 - webp_size / original_size) * 100
    print(f'Converted {converted} images: {original_size / 1024 / 1024:.2f} MB -> '
          f'{webp_size / 1024 / 1024:.2f} MB ({reduction:.1f}% smaller)')


if __name__ == '__main__':
    main()
