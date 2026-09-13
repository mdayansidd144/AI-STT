import asyncio
import os
import tempfile
import time

from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any

from faster_whisper import WhisperModel
from pydub import AudioSegment
from loguru import logger


class TranscriberService:

    def __init__(self):

        self.executor = ThreadPoolExecutor(
            max_workers=1
        )

        model_size = os.getenv(
            "WHISPER_MODEL_SIZE",
            "tiny"
        )

        device = os.getenv(
            "DEVICE",
            "cpu"
        )

        compute_type = os.getenv(
            "COMPUTE_TYPE",
            "int8"
        )

        logger.info(
            f"Loading Whisper model: "
            f"{model_size} / {device} / {compute_type}"
        )

        self.model = WhisperModel(
            model_size,
            device=device,
            compute_type=compute_type,
            cpu_threads=2,
            num_workers=1
        )

        self.history = []

        logger.info("Whisper model loaded")

    async def transcribe(
        self,
        audio_data: bytes,
        language: str = "auto"
    ) -> Dict[str, Any]:

        start_time = time.perf_counter()
        input_path = None
        wav_path = None

        try:

            if len(audio_data) < 500:
                return {
                    "success": False,
                    "error": "Audio too short",
                    "no_speech": True
                }

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".webm"
            ) as tmp:

                tmp.write(audio_data)
                input_path = tmp.name

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".wav"
            ) as tmp:

                wav_path = tmp.name

            try:

                audio = AudioSegment.from_file(
                    input_path
                )

                audio = (
                    audio
                    .set_channels(1)
                    .set_frame_rate(16000)
                )

                audio.export(
                    wav_path,
                    format="wav"
                )

            except Exception as conversion_error:

                logger.error(
                    f"Audio conversion failed: "
                    f"{conversion_error}"
                )

                return {
                    "success": False,
                    "error":
                        "Unable to decode audio file",
                    "no_speech": True
                }

            loop = asyncio.get_running_loop()

            segments, info = await loop.run_in_executor(
                self.executor,
                lambda: self.model.transcribe(
                    wav_path,
                    language=(
                        None
                        if language == "auto"
                        else language
                    ),
                    task="transcribe",
                    beam_size=1,
                    best_of=1,
                    temperature=0.0,
                    vad_filter=True,
                    vad_parameters={
                        "min_silence_duration_ms": 500
                    }
                )
            )

            texts = []

            for segment in segments:
                text = segment.text.strip()

                if text:
                    texts.append(text)

            result_text = " ".join(texts).strip()

            processing_ms = (
                time.perf_counter() - start_time
            ) * 1000

            word_count = len(
                result_text.split()
            )

            if not result_text:

                return {
                    "success": True,
                    "text": "",
                    "language": info.language,
                    "processing_ms":
                        round(processing_ms),
                    "words": 0,
                    "no_speech": True
                }

            self.history.insert(
                0,
                {
                    "id": len(self.history) + 1,
                    "text": result_text,
                    "language": info.language,
                    "timestamp": time.time(),
                    "words": word_count
                }
            )

            self.history = self.history[:100]

            return {
                "success": True,
                "text": result_text,
                "language": info.language,
                "processing_ms":
                    round(processing_ms),
                "words": word_count,
                "no_speech": False
            }

        except Exception as error:

            logger.exception(
                f"Transcription failed: {error}"
            )

            return {
                "success": False,
                "error": str(error),
                "no_speech": True
            }

        finally:

            for path in (
                input_path,
                wav_path
            ):

                if path and os.path.exists(path):

                    try:
                        os.unlink(path)
                    except OSError:
                        pass

    def get_history(self):
        return self.history

    def clear_history(self):
        self.history.clear()
        return True