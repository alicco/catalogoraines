import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from rembg import remove, new_session
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize a high-quality session once at startup
# "isnet-general-use" is generally better for product photography
try:
    session = new_session("isnet-general-use")
    print("✅ rembg session initialized with: isnet-general-use")
except Exception as e:
    print(f"⚠️ Failed to load isnet model, falling back to default: {e}")
    session = new_session("u2net")

@app.route('/', methods=['GET'])
def health_check():
    return "Server is running! Use POST /remove-bg to process images."

@app.route('/remove-bg', methods=['POST'])
def remove_background():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Read the input image
        input_image = file.read()
        
        # Remove background using rembg with ALPHA MATTING for better edges
        # Foreground/Background thresholds help refine the "fuzzy" areas like hair or soft edges
        output_image = remove(
            input_image, 
            session=session,
            alpha_matting=True,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=10
        )
        
        # Convert to RGBA (PNG) to ensure transparency
        img = Image.open(io.BytesIO(output_image)).convert("RGBA")
        
        # --- NEW: Standardize to 300x300 without cropping ---
        TARGET_SIZE = 300
        
        # Get dimensions
        w, h = img.size
        # Calculate scaling factor to fit the image within 300x300
        scale = min(TARGET_SIZE / w, TARGET_SIZE / h)
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        # Resize using high-quality resampling
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Create a new 300x300 transparent canvas
        final_img = Image.new("RGBA", (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
        
        # Paste the resized image into the center
        paste_x = (TARGET_SIZE - new_w) // 2
        paste_y = (TARGET_SIZE - new_h) // 2
        final_img.paste(img_resized, (paste_x, paste_y), img_resized)
        
        img = final_img
        # --- End of Standardizing ---

        # Check if SVG format is requested
        output_format = request.args.get('format', 'png').lower()
        
        if output_format == 'svg':
            # Create SVG with embedded base64 PNG
            img_io = io.BytesIO()
            img.save(img_io, 'PNG')
            img_io.seek(0)
            
            import base64
            base64_data = base64.b64encode(img_io.getvalue()).decode('utf-8')
            width, height = img.size
            
            svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">
  <image href="data:image/png;base64,{base64_data}" width="{width}" height="{height}" x="0" y="0" />
</svg>'''
            
            svg_io = io.BytesIO(svg_content.encode('utf-8'))
            svg_io.seek(0)
            
            filename_base = os.path.splitext(file.filename)[0]
            return send_file(
                svg_io,
                mimetype='image/svg+xml',
                as_attachment=True,
                download_name=f"{filename_base}.svg"
            )
        else:
            # Standard PNG response
            img_io = io.BytesIO()
            img.save(img_io, 'PNG')
            img_io.seek(0)
            
            filename_base = os.path.splitext(file.filename)[0]
            processed_filename = f"{filename_base}.png"
            
            return send_file(
                img_io, 
                mimetype='image/png', 
                as_attachment=True, 
                download_name=processed_filename
            )

    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Background Removal Server on http://0.0.0.0:5000")
    print("Ready to process images...")
    app.run(host='0.0.0.0', port=5000, debug=True)
