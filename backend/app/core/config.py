# from pydantic_settings import BaseSettings
# from typing import Dict, Optional
# from datetime import timedelta

# class Settings(BaseSettings):
#     APP_NAME: str = "AI Speech-to-Text Enterprise"
#     APP_VERSION: str = "5.0.0"
#     DEBUG: bool = True
#     ENVIRONMENT: str = "development"
    
#     # Database
#     DATABASE_URL: str = "sqlite:///./app.db"
    
#     # JWT Authentication
#     SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
#     ALGORITHM: str = "HS256"
#     ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
#     # Model Configuration
#     WHISPER_MODEL_SIZE: str = "base"
#     COMPUTE_TYPE: str = "int8"
#     DEVICE: str = "cpu"
#     SAMPLE_RATE: int = 16000
#     TARGET_LATENCY_MS: int = 2000
    
#     # 55+ Languages Support
#     SUPPORTED_LANGUAGES: Dict[str, str] = {
#         "auto": "🔍 Auto Detect",
#         # Indian Languages (25)
#         "hi": "🇮🇳 Hindi",
#         "bn": "🇮🇳 Bengali",
#         "te": "🇮🇳 Telugu",
#         "mr": "🇮🇳 Marathi",
#         "ta": "🇮🇳 Tamil",
#         "ur": "🇮🇳 Urdu",
#         "gu": "🇮🇳 Gujarati",
#         "kn": "🇮🇳 Kannada",
#         "ml": "🇮🇳 Malayalam",
#         "or": "🇮🇳 Odia",
#         "pa": "🇮🇳 Punjabi",
#         "as": "🇮🇳 Assamese",
#         "ne": "🇮🇳 Nepali",
#         "sd": "🇮🇳 Sindhi",
#         "sa": "🇮🇳 Sanskrit",
#         # European Languages (20)
#         "en": "🇺🇸 English",
#         "es": "🇪🇸 Spanish",
#         "fr": "🇫🇷 French",
#         "de": "🇩🇪 German",
#         "it": "🇮🇹 Italian",
#         "pt": "🇵🇹 Portuguese",
#         "nl": "🇳🇱 Dutch",
#         "pl": "🇵🇱 Polish",
#         "ru": "🇷🇺 Russian",
#         "uk": "🇺🇦 Ukrainian",
#         "sv": "🇸🇪 Swedish",
#         "no": "🇳🇴 Norwegian",
#         "da": "🇩🇰 Danish",
#         "fi": "🇫🇮 Finnish",
#         "el": "🇬🇷 Greek",
#         "cs": "🇨🇿 Czech",
#         "hu": "🇭🇺 Hungarian",
#         "ro": "🇷🇴 Romanian",
#         "bg": "🇧🇬 Bulgarian",
#         "hr": "🇭🇷 Croatian",
#         # Asian Languages (15)
#         "zh": "🇨🇳 Chinese",
#         "ja": "🇯🇵 Japanese",
#         "ko": "🇰🇷 Korean",
#         "vi": "🇻🇳 Vietnamese",
#         "th": "🇹🇭 Thai",
#         "id": "🇮🇩 Indonesian",
#         "ms": "🇲🇾 Malay",
#         "fa": "🇮🇷 Persian",
#         "he": "🇮🇱 Hebrew",
#         "ar": "🇸🇦 Arabic",
#         "tr": "🇹🇷 Turkish",
#         "km": "🇰🇭 Khmer",
#         "lo": "🇱🇦 Lao",
#         "my": "🇲🇲 Burmese",
#         "mn": "🇲🇳 Mongolian"
#     }
    
#     CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]

# settings = Settings()

# import os
# os.makedirs("./exports", exist_ok=True)
from pydantic_settings import BaseSettings
from typing import Dict, Optional, List
from datetime import timedelta
import os

class Settings(BaseSettings):
    APP_NAME: str = "AI Speech-to-Text Enterprise"
    APP_VERSION: str = "5.0.0"
    
    # ✅ Get from environment variable (Render sets this)
    ENVIRONMENT: str = os.environ.get("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"
    
    # Database - SQLite works on Render (ephemeral storage)
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./app.db")
    
    # JWT Authentication - ✅ Use environment variable in production
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "your-super-secret-key-change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    # Model Configuration - ✅ Use environment variables for Render
    WHISPER_MODEL_SIZE: str = os.environ.get("WHISPER_MODEL_SIZE", "tiny")  # tiny for Render
    COMPUTE_TYPE: str = os.environ.get("COMPUTE_TYPE", "int8")
    DEVICE: str = os.environ.get("DEVICE", "cpu")
    SAMPLE_RATE: int = 16000
    TARGET_LATENCY_MS: int = 2000
    
    # 55+ Languages Support
    SUPPORTED_LANGUAGES: Dict[str, str] = {
        "auto": "🔍 Auto Detect",
        # Indian Languages (25)
        "hi": "🇮🇳 Hindi",
        "bn": "🇮🇳 Bengali",
        "te": "🇮🇳 Telugu",
        "mr": "🇮🇳 Marathi",
        "ta": "🇮🇳 Tamil",
        "ur": "🇮🇳 Urdu",
        "gu": "🇮🇳 Gujarati",
        "kn": "🇮🇳 Kannada",
        "ml": "🇮🇳 Malayalam",
        "or": "🇮🇳 Odia",
        "pa": "🇮🇳 Punjabi",
        "as": "🇮🇳 Assamese",
        "ne": "🇮🇳 Nepali",
        "sd": "🇮🇳 Sindhi",
        "sa": "🇮🇳 Sanskrit",
        # European Languages (20)
        "en": "🇺🇸 English",
        "es": "🇪🇸 Spanish",
        "fr": "🇫🇷 French",
        "de": "🇩🇪 German",
        "it": "🇮🇹 Italian",
        "pt": "🇵🇹 Portuguese",
        "nl": "🇳🇱 Dutch",
        "pl": "🇵🇱 Polish",
        "ru": "🇷🇺 Russian",
        "uk": "🇺🇦 Ukrainian",
        "sv": "🇸🇪 Swedish",
        "no": "🇳🇴 Norwegian",
        "da": "🇩🇰 Danish",
        "fi": "🇫🇮 Finnish",
        "el": "🇬🇷 Greek",
        "cs": "🇨🇿 Czech",
        "hu": "🇭🇺 Hungarian",
        "ro": "🇷🇴 Romanian",
        "bg": "🇧🇬 Bulgarian",
        "hr": "🇭🇷 Croatian",
        # Asian Languages (15)
        "zh": "🇨🇳 Chinese",
        "ja": "🇯🇵 Japanese",
        "ko": "🇰🇷 Korean",
        "vi": "🇻🇳 Vietnamese",
        "th": "🇹🇭 Thai",
        "id": "🇮🇩 Indonesian",
        "ms": "🇲🇾 Malay",
        "fa": "🇮🇷 Persian",
        "he": "🇮🇱 Hebrew",
        "ar": "🇸🇦 Arabic",
        "tr": "🇹🇷 Turkish",
        "km": "🇰🇭 Khmer",
        "lo": "🇱🇦 Lao",
        "my": "🇲🇲 Burmese",
        "mn": "🇲🇳 Mongolian"
    }
    
    # ✅ CORS origins - dynamically add Render frontend URL
    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins = ["http://localhost:3000", "http://localhost:3001"]
        render_frontend = os.environ.get("FRONTEND_URL", "")
        if render_frontend:
            origins.append(render_frontend)
            origins.append(render_frontend.replace("https://", "http://"))
        return origins

settings = Settings()

# Create necessary directories
os.makedirs("./exports", exist_ok=True)
os.makedirs("./data", exist_ok=True)