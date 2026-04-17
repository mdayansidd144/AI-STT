import aiohttp
import asyncio
from typing import Dict
from functools import lru_cache
from loguru import logger

class TranslationService:
    def __init__(self):
        self.cache = {}
        self.session = None
        logger.info("Translation service ready (cached)")
    
    async def get_session(self):
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session
    
    @lru_cache(maxsize=1000)
    def _get_cached(self, cache_key: str) -> str:
        return self.cache.get(cache_key)
    
    async def translate(self, text: str, source: str, target: str) -> Dict:
        if not text or not text.strip():
            return {"success": True, "translated_text": "", "original_text": text}
        
        if source == target:
            return {"success": True, "translated_text": text, "original_text": text}
        
        # Check cache first (instant response)
        cache_key = f"{source}:{target}:{text[:100]}"
        if cache_key in self.cache:
            logger.info(f"✅ Cache hit - instant translation")
            return {
                "success": True,
                "translated_text": self.cache[cache_key],
                "original_text": text,
                "cached": True
            }
        
        try:
            url = "https://translate.googleapis.com/translate_a/single"
            params = {
                "client": "gtx",
                "sl": source if source != "auto" else "auto",
                "tl": target,
                "dt": "t",
                "q": text[:500]  # Limit for speed
            }
            
            session = await self.get_session()
            
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=3)) as response:
                if response.status == 200:
                    data = await response.json()
                    translated = ""
                    for item in data[0]:
                        if item[0]:
                            translated += item[0]
                    
                    # Cache the result
                    self.cache[cache_key] = translated
                    
                    return {
                        "success": True,
                        "translated_text": translated,
                        "original_text": text,
                        "source_lang": source,
                        "target_lang": target,
                        "cached": False
                    }
                else:
                    return {"success": False, "error": "Translation failed", "translated_text": text}
                    
        except asyncio.TimeoutError:
            logger.warning("Translation timeout")
            return {"success": False, "error": "Timeout", "translated_text": text}
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return {"success": False, "error": str(e), "translated_text": text}
    
    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()