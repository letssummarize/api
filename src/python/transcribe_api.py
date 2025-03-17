from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import tempfile
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("transcribe_api")

app = FastAPI()

# Load model settings from .env
MODEL_SIZE = os.getenv("MODEL_SIZE", "small")  # Change to "large-v2" if needed
DEVICE = os.getenv("DEVICE", "cpu")  # Use "cuda" for GPU if available

# Set compute type (Use "int8" for CPU, "float16" for GPU)
COMPUTE_TYPE = "int8" if DEVICE == "cpu" else "float16"

logger.info(f"Loading Whisper model: {MODEL_SIZE} on {DEVICE} with {COMPUTE_TYPE}")

# Load the Faster-Whisper model
try:
    model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    logger.info("Model loaded successfully!")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    model = None  # Prevent app crash if model fails

@app.get("/")
def health_check():
    """Simple health check endpoint"""
    return {"status": "running", "model_loaded": model is not None}

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    """Receives an audio file and returns its transcript"""
    if not model:
        return {"error": "Model failed to load. Check logs."}

    logger.info(f"Received file: {file.filename}")

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
        temp_file.write(await file.read())
        temp_file_path = temp_file.name
        logger.info(f"Saved file temporarily at: {temp_file_path}")

    # Transcribe
    try:
        logger.info(f"Starting transcription for: {temp_file_path}")
        segments, info = model.transcribe(temp_file_path, beam_size=5)
        transcription = " ".join(segment.text for segment in segments)
        logger.info(f"Transcription completed: {transcription[:100]}...")  # Show first 100 chars
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return {"error": str(e)}

    # Cleanup
    os.remove(temp_file_path)
    logger.info("Temporary file cleaned up")

    return {"text": transcription, "language": info.language, "probability": info.language_probability}

if __name__ == "__main__":
    logger.info(f"Starting FastAPI server on port {os.getenv('TRANSCRIBE_API_PORT', 5566)}")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("TRANSCRIBE_API_PORT", 5566)))
