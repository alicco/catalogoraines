
from PIL import Image
import os

def check_transparency(image_path):
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        return

    img = Image.open(image_path)
    print(f"Image: {image_path}")
    print(f"Mode: {img.mode}")
    
    if img.mode != 'RGBA':
        print("Image is not RGBA!")
        return

    # Check for transparent pixels
    alpha = img.getchannel('A')
    extrema = alpha.getextrema()
    print(f"Alpha extrema: {extrema}")
    
    if extrema[0] == 255:
        print("No transparent pixels found (all alpha=255)")
    else:
        # Count some transparent pixels
        pixels = list(alpha.getdata())
        transparent_count = sum(1 for p in pixels if p < 255)
        print(f"Transparent pixels: {transparent_count} / {len(pixels)}")

if __name__ == "__main__":
    check_transparency(r"c:\Users\forza\Documents\Raines1.0\public\raines_images\IMG_0133.png")
