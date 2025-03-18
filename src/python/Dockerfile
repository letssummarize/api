# Use Python as base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (including wget)
RUN apt update && apt install -y wget

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Ensure model directory exists & download model inside Docker
RUN mkdir -p /root/.cache/whisper && \
    wget -O /root/.cache/whisper/ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin

# Copy application files
COPY . .

# Run the FastAPI application
CMD ["python", "transcribe_api/transcribe_api.py"]