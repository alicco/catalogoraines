
import os
import sys
from rembg import remove
from PIL import Image
import io


def process_images(input_dirs, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")

    all_files = []
    for d in input_dirs:
        if os.path.exists(d):
            files = [os.path.join(d, f) for f in os.listdir(d) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            all_files.extend(files)
    
    # Deduplicate by filename (taking the one from 'non scontornate' if both exist)
    unique_files = {}
    for f in all_files:
        name = os.path.basename(f)
        if name not in unique_files or "non scontornate" in f:
            unique_files[name] = f
    
    process_list = list(unique_files.values())
    total = len(process_list)
    print(f"Found {total} unique images to process across all sources.")

    for i, input_path in enumerate(process_list):
        filename = os.path.basename(input_path)
        # Change extension to .png for transparency support
        output_filename = os.path.splitext(filename)[0] + ".png"
        output_path = os.path.join(output_dir, output_filename)

        # If the input is already a PNG in the output dir, we might want to re-process it if it's not transparent
        # but to save time and be safe, let's re-process everything if it's a JPG or if we want forced transparency.
        # However, to avoid infinite loops if input_dir == output_dir, we check:
        if input_path == output_path:
             # Skip if it's already the target and we don't have a better source
             continue

        print(f"[{i+1}/{total}] Processing {filename}...")
        try:
            with open(input_path, 'rb') as f:
                input_data = f.read()
                output_data = remove(input_data)
                
                img = Image.open(io.BytesIO(output_data)).convert("RGBA")
                img.save(output_path, "PNG")
                
            print(f"      Saved to {output_filename}")
        except Exception as e:
            print(f"      Error processing {filename}: {str(e)}")

    print("Finished processing all images!")

if __name__ == "__main__":
    sources = [
        r"c:\Users\forza\Documents\Raines1.0\immagini\immagini Raines non scontornate",
        r"c:\Users\forza\Documents\Raines1.0\public\raines_images"
    ]
    output_folder = r"c:\Users\forza\Documents\Raines1.0\public\raines_images"
    process_images(sources, output_folder)
