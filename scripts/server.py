import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from rembg import remove
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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
        
        # Remove background using rembg
        output_image = remove(input_image)
        
        # Convert to RGBA (PNG) to ensure transparency
        img = Image.open(io.BytesIO(output_image)).convert("RGBA")
        
        # Save to BytesIO object to send back
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        
        # Construct a filename for the download
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
    print("🚀 Starting Background Removal Server on http://localhost:5000")
    print("Ready to process images...")
    app.run(port=5000, debug=True)
