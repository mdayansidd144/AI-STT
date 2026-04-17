
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import time
from loguru import logger
from app.services.transcriber import TranscriberService
from app.services.translation_service import TranslationService
from app.services.pdf_export import PDFExportService
app = FastAPI()
# CORS-Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

transcriber = TranscriberService()
translator = TranslationService()
pdf_export = PDFExportService()

@app.get("/")
@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/languages")
async def get_languages():
    return {
        "languages": {
            "auto": "🔍 Auto Detect",
            "hi": "🇮🇳 Hindi (हिन्दी)",
            "bn": "🇮🇳 Bengali (বাংলা)",
            "te": "🇮🇳 Telugu (తెలుగు)",
            "mr": "🇮🇳 Marathi (मराठी)",
            "ta": "🇮🇳 Tamil (தமிழ்)",
            "ur": "🇮🇳 Urdu (اردو)",
            "gu": "🇮🇳 Gujarati (ગુજરાતી)",
            "kn": "🇮🇳 Kannada (ಕನ್ನಡ)",
            "ml": "🇮🇳 Malayalam (മലയാളം)",
            "or": "🇮🇳 Odia (ଓଡ଼ିଆ)",
            "pa": "🇮🇳 Punjabi (ਪੰਜਾਬੀ)",
            "as": "🇮🇳 Assamese (অসমীয়া)",
            "ne": "🇮🇳 Nepali (नेपाली)",
            "sd": "🇮🇳 Sindhi (سنڌي)",
            "sa": "🇮🇳 Sanskrit (संस्कृतम्)",
            "en": "🇺🇸 English",
            "es": "🇪🇸 Spanish",
            "fr": "🇫🇷 French",
            "de": "🇩🇪 German",
            "zh": "🇨🇳 Chinese",
            "ja": "🇯🇵 Japanese",
            "ko": "🇰🇷 Korean",
            "ru": "🇷🇺 Russian",
            "ar": "🇸🇦 Arabic"
        }
    }

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), language: str = "auto"):
    start = time.time()
    content = await file.read()
    
    if len(content) < 500:
        return JSONResponse({"success": False, "error": "Audio too short", "no_speech": True})
    
    result = await transcriber.transcribe(content, language)
    result["total_time_ms"] = round((time.time() - start) * 1000)
    return JSONResponse(result)

@app.post("/translate")
async def translate(request: dict):
    text = request.get("text", "")
    target = request.get("target", "hi")
    source = request.get("source", "auto")
    
    result = await translator.translate(text, source, target)
    return JSONResponse(result)

@app.post("/export-pdf")
async def export_pdf(request: dict):
    try:
        original = request.get("original", "")
        translated = request.get("translated", "")
        source = request.get("source", "en")
        target = request.get("target", "")
        
        if not original:
            return JSONResponse({"success": False, "error": "No content to export"})
        
        pdf_path = await pdf_export.create_pdf(original, translated, source, target)
        
        return FileResponse(
            pdf_path, 
            media_type="application/pdf",
            filename=f"transcript_{int(time.time())}.pdf"
        )
    except Exception as e:
        logger.error(f"Export error: {e}")
        return JSONResponse({"success": False, "error": str(e)})

@app.get("/history")
async def get_history():
    return {"history": transcriber.get_history()}

@app.delete("/history")
async def clear_history():
    transcriber.clear_history()
    return {"success": True}

