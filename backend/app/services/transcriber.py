import asyncio
import time
import os
import tempfile
from typing import Dict, Any
from concurrent.futures import ThreadPoolExecutor
from faster_whisper import WhisperModel
from pydub import AudioSegment
from loguru import logger
class TranscriberService:
    """ULTRA FAST Transcription - 0.5-1 second latency"""
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=2)
        
        logger.info("Loading Whisper model (Ultra Fast)...")
        self.model = WhisperModel(
            "tiny",  # FASTEST - 10x faster
            device="cpu",
            compute_type="int8",
            cpu_threads=4,
            num_workers=2
        )
        logger.info("✅ Ultra fast model ready")
        
        self.history = []
    
    async def transcribe(self, audio_data: bytes, language: str = "auto") -> Dict[str, Any]:
        start_ms = time.perf_counter() * 1000
        temp_path = None
        
        try:
            if len(audio_data) < 500:
                return {"success": False, "error": "Audio too short", "no_speech": True}
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
                tmp.write(audio_data)
                temp_path = tmp.name
            
            try:
                audio = AudioSegment.from_file(temp_path)
                audio = audio.set_channels(1).set_frame_rate(16000)
                audio.export(temp_path, format="wav")
            except:
                pass
            
            loop = asyncio.get_event_loop()
            
            segments, info = await loop.run_in_executor(
                self.executor,
                lambda: self.model.transcribe(
                    temp_path,
                    language=None if language == "auto" else language,
                    task="transcribe",
                    beam_size=1,
                    best_of=1,
                    temperature=0.0,
                    vad_filter=False
                )
            )
            
            full_text = ""
            for segment in segments:
                text = segment.text.strip()
                if text:
                    full_text += " " + text
            
            processing_ms = (time.perf_counter() * 1000) - start_ms
            word_count = len(full_text.split())
            
            result_text = full_text.strip() if full_text else ""
            
            if result_text and len(result_text) > 10:
                self.history.insert(0, {
                    "id": len(self.history),
                    "text": result_text,
                    "language": info.language,
                    "timestamp": time.time(),
                    "words": word_count
                })
                self.history = self.history[:100]
            
            logger.info(f"⚡ {word_count} words in {processing_ms:.0f}ms")
            
            return {
                "success": True,
                "text": result_text,
                "language": info.language,
                "processing_ms": round(processing_ms),
                "words": word_count,
                "no_speech": False
            }
            
        except Exception as e:
            logger.error(f"Error: {e}")
            return {"success": False, "error": str(e), "no_speech": True}
        
        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except:
                    pass
    
    def get_history(self):
        return self.history
    
    def clear_history(self):
        self.history = []
        return True
