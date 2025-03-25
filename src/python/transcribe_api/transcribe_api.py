from fastapi import FastAPI, UploadFile, File, HTTPException
from faster_whisper import WhisperModel
import tempfile
import os
import logging
import sys
import threading
import time
import hashlib
from typing import Dict, Any

# 🚀 Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("transcribe_api")

# 🌍 Load Configuration from .env or defaults
MODEL_SIZE = os.getenv("MODEL_SIZE", "tiny")  # tiny, base, small, medium, large-v2
DEVICE = os.getenv("DEVICE", "cpu")  # cpu, cuda
COMPUTE_TYPE = os.getenv("COMPUTE_TYPE", "int8" if DEVICE == "cpu" else "float16")
MODEL_LOAD_TIMEOUT = int(
    os.getenv("MODEL_LOAD_TIMEOUT", "60")
)  # Max seconds to wait for model

# 🎙️ Whisper Transcription Configuration
WHISPER_BEAM_SIZE = int(os.getenv("WHISPER_BEAM_SIZE", "1"))
WHISPER_LANGUAGE = os.getenv("WHISPER_LANGUAGE", "en")
WHISPER_TEMPERATURE = float(os.getenv("WHISPER_TEMPERATURE", "0.3"))

# 🔊 Audio Settings
AUDIO_FORMAT = os.getenv("AUDIO_FORMAT", "mp3")

# 🗂️ Cache Configuration
ENABLE_CACHE = os.getenv("ENABLE_CACHE", "true").lower() == "true"
MAX_CACHE_ITEMS = int(os.getenv("MAX_CACHE_ITEMS", "100"))

logger.info(f"⚡ Model: {MODEL_SIZE}, Device: {DEVICE}, Compute Type: {COMPUTE_TYPE}")
logger.info(f"🎙️ Audio Format: {AUDIO_FORMAT}")
logger.info(
    f"📝 Beam Size: {WHISPER_BEAM_SIZE}, Language: {WHISPER_LANGUAGE}, Temperature: {WHISPER_TEMPERATURE}"
)
logger.info(f"⏳ Model Load Timeout: {MODEL_LOAD_TIMEOUT} seconds")

app = FastAPI()

# 🧠 Global Model & Cache
model = None
model_loading = False
model_error = None
transcription_cache: Dict[str, Any] = {}


def load_model():
    """Loads the Whisper model in a background thread."""
    global model, model_loading, model_error
    model_loading = True

    try:
        start_time = time.time()
        logger.info("🚀 Loading Whisper model...")

        model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)

        elapsed_time = time.time() - start_time
        logger.info(f"✅ Model loaded successfully in {elapsed_time:.2f} seconds!")
        model_error = None
    except Exception as e:
        model_error = f"Failed to load model: {str(e)}"
        logger.error(model_error, exc_info=True)
    finally:
        model_loading = False


# 🚀 Start loading the model asynchronously on startup
threading.Thread(target=load_model, daemon=True).start()


def get_file_hash(file_content: bytes) -> str:
    """Generates a unique hash for the file to enable caching."""
    return hashlib.md5(file_content).hexdigest()

@app.get("/")
def health_check():
    """💡 API health check endpoint."""
    return {
        "status": "running",
        "model_loaded": model is not None,
        "model_loading": model_loading,
        "model_error": model_error,
    }


@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    """🎙️ Receives an audio file and returns the transcription."""
    global model

    if model_loading:
        logger.warning("⏳ Model is still loading...")
        raise HTTPException(
            status_code=503, detail="Model is still loading. Try again later."
        )

    if model_error:
        logger.error("❌ Model loading failed.")
        raise HTTPException(status_code=500, detail=f"Model error: {model_error}")

    file_content = await file.read()
    file_hash = get_file_hash(file_content)

    # 🔄 Check cache before processing
    if ENABLE_CACHE and file_hash in transcription_cache:
        logger.info(f"📦 Cache hit for {file.filename}")
        return transcription_cache[file_hash]

    # 📂 Save file temporarily
    with tempfile.NamedTemporaryFile(
        delete=False, suffix=f".{AUDIO_FORMAT}"
    ) as temp_file:
        temp_file.write(file_content)
        temp_file_path = temp_file.name

    logger.info(f"📂 Saved temporary file: {temp_file_path}")

    try:
        start_time = time.time()
        logger.info(f"🎤 Transcribing {file.filename}...")

        segments, info = model.transcribe(
            temp_file_path,
            beam_size=WHISPER_BEAM_SIZE,
            language=None,
            temperature=WHISPER_TEMPERATURE,
            vad_parameters={"min_silence_duration_ms": 500},
        )

        # Collect Transcription
        transcription = " ".join(segment.text for segment in segments)
        processing_time = time.time() - start_time

        logger.info(f"✅ Transcription completed in {processing_time:.2f}s")
        logger.info(
            f"📝 Detected Language: {info.language} (Probability: {info.language_probability:.4f})"
        )
        logger.info(f"💬 Transcription Preview: {transcription[:100]}...")

        response = {
            "text": transcription,
            "language": info.language,
            "probability": info.language_probability,
            "processing_time": processing_time,
        }

        # 🗂️ Cache the result
        if ENABLE_CACHE:
            transcription_cache[file_hash] = response
            if len(transcription_cache) > MAX_CACHE_ITEMS:
                oldest_key = next(iter(transcription_cache))
                del transcription_cache[oldest_key]
                logger.info("♻️ Cache full, removed oldest entry.")

        return response

    except Exception as e:
        logger.error(f"🚨 Transcription failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Error processing transcription: {str(e)}"
        )

    finally:
        os.remove(temp_file_path)
        logger.info(f"🗑️ Cleaned up temporary file: {temp_file_path}")


if __name__ == "__main__":
    logger.info(
        f"🚀 Starting FastAPI server on port {os.getenv('TRANSCRIBE_API_PORT', 5566)}"
    )
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("TRANSCRIBE_API_PORT", 5566)),
        log_level="info",
    )
