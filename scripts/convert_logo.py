import base64
import os
from PIL import Image

# Paths
INPUT_PATH = r"c:\Users\forza\Documents\Raines1.0\public\logo raines.jpg"
OUTPUT_PATH = r"c:\Users\forza\Documents\Raines1.0\public\raines_logo.svg"

def convert_to_embedded_svg(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Error: Input file not found at {input_path}")
        return

    try:
        # Open image to get dimensions
        with Image.open(input_path) as img:
            width, height = img.size
            
        # Read encoded data
        with open(input_path, "rb") as f:
            encoded_string = base64.b64encode(f.read()).decode('utf-8')
            
        # Create SVG content
        svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" version="1.1">
    <image width="{width}" height="{height}" href="data:image/jpeg;base64,{encoded_string}" />
</svg>"""

        # Write to file
        with open(output_path, "w") as f:
            f.write(svg_content)
            
        print(f"Successfully converted {input_path} to {output_path}")
        print(f"Dimensions: {width}x{height}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    convert_to_embedded_svg(INPUT_PATH, OUTPUT_PATH)
