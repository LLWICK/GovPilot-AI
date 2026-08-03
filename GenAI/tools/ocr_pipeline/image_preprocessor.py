# tools/image_preprocessor.py
import numpy as np
from PIL import Image, ImageFilter, ImageOps


def _otsu_threshold(gray: np.ndarray) -> int:
    hist, _ = np.histogram(gray.ravel(), bins=256, range=(0, 256))
    total = gray.size
    sum_total = np.dot(np.arange(256), hist)

    sum_bg = 0.0
    weight_bg = 0
    best_threshold = 0
    best_variance = 0.0

    for threshold in range(256):
        weight_bg += hist[threshold]
        if weight_bg == 0:
            continue

        weight_fg = total - weight_bg
        if weight_fg == 0:
            break

        sum_bg += threshold * hist[threshold]
        mean_bg = sum_bg / weight_bg
        mean_fg = (sum_total - sum_bg) / weight_fg
        variance = weight_bg * weight_fg * (mean_bg - mean_fg) ** 2

        if variance > best_variance:
            best_variance = variance
            best_threshold = threshold

    return best_threshold


def preprocess_page(pil_image: Image.Image) -> Image.Image:
    gray = pil_image.convert("L")
    gray = gray.filter(ImageFilter.MedianFilter(size=3))
    gray = ImageOps.autocontrast(gray)

    arr = np.array(gray)
    threshold = _otsu_threshold(arr)
    binary = np.where(arr > threshold, 255, 0).astype(np.uint8)
    return Image.fromarray(binary)
