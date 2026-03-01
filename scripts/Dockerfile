FROM python:3.9

WORKDIR /app

# Install Python dependencies
RUN pip install --no-cache-dir flask flask-cors rembg pillow onnxruntime

# Copy the script
COPY server.py .

# Expose the port
EXPOSE 5000

# Run the server
CMD ["python", "server.py"]
