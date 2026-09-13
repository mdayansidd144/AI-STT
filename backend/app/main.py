import os
import time

from fastapi import (
    FastAPI,
    File,
    UploadFile,
    Depends,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import (
    JSONResponse,
    FileResponse,
)
from sqlalchemy.orm import Session
from loguru import logger

from app.services.transcriber import TranscriberService
from app.services.translation_service import TranslationService
from app.services.pdf_export import PDFExportService

from app.api import (
    auth,
    user,
    adaptive,
)

from app.api.auth import get_current_user
from app.core.database import (
    get_db,
    init_db,
)

from app.models.user import User
from app.models.transcription import Transcription


app = FastAPI(
    title="AI Speech-to-Text API",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

frontend_url = os.getenv(
    "FRONTEND_URL",
    ""
).strip()

if frontend_url:
    allowed_origins.append(
        frontend_url.rstrip("/")
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# SERVICES
# ============================================================

transcriber = TranscriberService()
translator = TranslationService()
pdf_export = PDFExportService()


# ============================================================
# DATABASE
# ============================================================

@app.on_event("startup")
async def startup_event():

    logger.info("Initializing database")

    init_db()

    logger.info("Database initialized")


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"]
)

app.include_router(
    user.router,
    prefix="/api/user",
    tags=["User"]
)

app.include_router(
    adaptive.router,
    prefix="/api/adaptive",
    tags=["Adaptive Learning"]
)


# ============================================================
# HEALTH
# ============================================================

@app.get("/")
@app.get("/health")
async def health():

    return {
        "status": "healthy",
        "environment": os.getenv(
            "ENVIRONMENT",
            "development"
        ),
        "model": os.getenv(
            "WHISPER_MODEL_SIZE",
            "tiny"
        )
    }


# ============================================================
# LANGUAGES
# ============================================================

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


# ============================================================
# TRANSCRIPTION
# ============================================================

@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: str = "auto",
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):

    start = time.perf_counter()

    content = await file.read()

    if len(content) < 500:

        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "Audio too short",
                "no_speech": True
            }
        )

    # 10 MB safety limit
    if len(content) > 10 * 1024 * 1024:

        return JSONResponse(
            status_code=413,
            content={
                "success": False,
                "error":
                    "Audio file is too large. "
                    "Maximum size is 10 MB.",
                "no_speech": True
            }
        )

    result = await transcriber.transcribe(
        content,
        language
    )

    if not result.get("success"):
        return JSONResponse(
            status_code=500,
            content=result
        )

    detected_language = result.get(
        "language",
        language if language != "auto" else "en"
    )

    text = result.get("text", "")

    processing_ms = result.get(
        "processing_ms",
        round(
            (time.perf_counter() - start)
            * 1000
        )
    )

    word_count = result.get(
        "words",
        len(text.split())
    )

    # Save history to database
    if text:

        transcription = Transcription(
            user_id=current_user.id,
            original_text=text,
            translated_text=None,
            source_language=language,
            target_language=None,
            detected_language=detected_language,
            processing_time_ms=processing_ms,
            audio_duration_seconds=0.0,
            word_count=word_count,
            efficiency_score=None,
            file_name=file.filename,
            file_size_bytes=len(content),
            was_corrected=False,
        )

        db.add(transcription)

        current_user.total_transcriptions = (
            current_user.total_transcriptions or 0
        ) + 1

        current_user.total_words = (
            current_user.total_words or 0
        ) + word_count

        db.commit()
        db.refresh(transcription)

        result["transcription_id"] = (
            transcription.id
        )

    result["total_time_ms"] = round(
        (time.perf_counter() - start)
        * 1000
    )

    return JSONResponse(result)


# ============================================================
# TRANSLATION
# ============================================================

@app.post("/translate")
async def translate(request: dict):

    text = request.get(
        "text",
        ""
    ).strip()

    target = request.get(
        "target",
        "hi"
    )

    source = request.get(
        "source",
        "auto"
    )

    if not text:

        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "Text is required"
            }
        )

    result = await translator.translate(
        text,
        source,
        target
    )

    return JSONResponse(result)


# ============================================================
# PDF EXPORT
# ============================================================

@app.post("/export-pdf")
async def export_pdf(request: dict):

    try:

        original = request.get(
            "original",
            ""
        )

        translated = request.get(
            "translated",
            ""
        )

        source = request.get(
            "source",
            "en"
        )

        target = request.get(
            "target",
            ""
        )

        if not original.strip():

            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error":
                        "No content to export"
                }
            )

        pdf_path = await pdf_export.create_pdf(
            original=original,
            translated=translated,
            source=source,
            target=target
        )

        if not pdf_path.endswith(".pdf"):

            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error":
                        "PDF generation failed"
                }
            )

        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=(
                f"transcript_{int(time.time())}.pdf"
            )
        )

    except Exception as error:

        logger.exception(
            f"PDF export failed: {error}"
        )

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error":
                    "PDF generation failed"
            }
        )


# ============================================================
# HISTORY
# ============================================================

@app.get("/history")
async def get_history(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):

    limit = min(max(limit, 1), 100)
    skip = max(skip, 0)

    records = (
        db.query(Transcription)
        .filter(
            Transcription.user_id ==
            current_user.id
        )
        .order_by(
            Transcription.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    history = []

    for item in records:

        history.append({
            "id": item.id,
            "text": item.original_text,
            "translated_text":
                item.translated_text,
            "language":
                item.detected_language,
            "timestamp":
                item.created_at.isoformat()
                if item.created_at
                else None,
            "words":
                item.word_count,
            "processing_ms":
                item.processing_time_ms,
        })

    return {
        "history": history,
        "count": len(history)
    }


@app.delete("/history")
async def clear_history(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):

    deleted = (
        db.query(Transcription)
        .filter(
            Transcription.user_id ==
            current_user.id
        )
        .delete(
            synchronize_session=False
        )
    )

    current_user.total_transcriptions = 0
    current_user.total_words = 0

    db.commit()

    return {
        "success": True,
        "deleted": deleted
    }


# ============================================================
# LOCAL ENTRY POINT
# ============================================================

if __name__ == "__main__":

    import uvicorn

    port = int(
        os.getenv(
            "PORT",
            "8000"
        )
    )

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )