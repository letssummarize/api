from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import tempfile
import os
import logging
import sys
import threading
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("transcribe_api")

app = FastAPI()

# Load model settings from .env
MODEL_SIZE = os.getenv("MODEL_SIZE", "tiny")  # Using tiny model for faster loading
DEVICE = os.getenv("DEVICE", "cpu")  # Use "cuda" for GPU if available

# Set compute type (Use "int8" for CPU, "float16" for GPU)
COMPUTE_TYPE = "int8" if DEVICE == "cpu" else "float16"

logger.info(f"Starting with configuration: MODEL_SIZE={MODEL_SIZE}, DEVICE={DEVICE}, COMPUTE_TYPE={COMPUTE_TYPE}")

# Global model variable
model = None
model_loading = False
model_loading_error = None

def load_model_thread():
    """Load the Whisper model in a separate thread"""
    global model, model_loading, model_loading_error
    try:
        logger.info("Starting model loading in thread...")
        model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
        logger.info("Model loaded successfully!")
        model_loading_error = None
    except Exception as e:
        error_msg = f"Failed to load model: {str(e)}"
        logger.error(error_msg, exc_info=True)
        model_loading_error = error_msg
    finally:
        model_loading = False

def start_model_loading():
    """Start the model loading process in a separate thread"""
    global model_loading
    if not model_loading and model is None:
        model_loading = True
        thread = threading.Thread(target=load_model_thread)
        thread.daemon = True
        thread.start()
        return True
    return False

@app.get("/")
def health_check():
    """Simple health check endpoint"""
    return {
        "status": "running", 
        "model_loaded": model is not None,
        "model_loading": model_loading,
        "model_error": model_loading_error
    }

@app.get("/load-model")
def load_model_endpoint():
    """Endpoint to explicitly start model loading in background"""
    started = start_model_loading()
    return {
        "status": "loading_started" if started else "already_loading_or_loaded", 
        "model_loaded": model is not None,
        "model_loading": model_loading,
        "model_error": model_loading_error
    }

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    """Receives an audio file and returns its transcript"""
    global model
    
    # Try to load model if it's not loaded yet
    if model is None:
        if not start_model_loading():
            return {"error": "Model is already loading or loaded. Please wait."}
        # Wait for model to load with a timeout of 60 seconds
        for _ in range(60):
            if model is not None:
                break
            time.sleep(1)
        else:
            return {"error": "Model failed to load within 60 seconds. Check logs."}
    
    if model is None:
        return {"error": "Model failed to load. Please check logs for details.", "error_details": model_loading_error}

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
        logger.error(f"Transcription failed: {str(e)}", exc_info=True)
        return {"error": str(e)}

    # Cleanup
    os.remove(temp_file_path)
    logger.info("Temporary file cleaned up")

    return {"text": transcription, "language": info.language, "probability": info.language_probability}

if __name__ == "__main__":
    try:
        # Don't load model at startup, load it on first request
        # This makes the API start faster
        
        port = int(os.getenv("TRANSCRIBE_API_PORT", 5566))
        logger.info(f"Starting FastAPI server on port {port}")
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}", exc_info=True)
