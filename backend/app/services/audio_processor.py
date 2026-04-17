import numpy as np
import librosa
import soundfile as sf
import tempfile
import os
from scipy import signal
from scipy.ndimage import median_filter
from loguru import logger

class AudioProcessor:
    """Professional noise reduction for crystal clear audio"""
    
    def __init__(self):
        self.sample_rate = 16000
    
    async def enhance_audio(self, audio_path: str) -> str:
        """Apply 10-stage professional noise reduction"""
        try:
            # Load audio
            audio, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Stage 1: High-pass filter (remove rumble, AC, wind)
            b, a = signal.butter(4, 80, btype='high', fs=sr)
            audio = signal.filtfilt(b, a, audio)
            
            # Stage 2: Low-pass filter (remove hiss, static)
            b, a = signal.butter(4, 7500, btype='low', fs=sr)
            audio = signal.filtfilt(b, a, audio)
            
            # Stage 3: Notch filters (remove 50/60Hz hum)
            for freq in [50, 60, 120, 180]:
                try:
                    b, a = signal.iirnotch(freq, 30, sr)
                    audio = signal.filtfilt(b, a, audio)
                except:
                    pass
            
            # Stage 4: Spectral noise reduction
            energy = np.abs(audio)
            noise_floor = np.percentile(energy, 10)
            threshold = noise_floor * 1.5
            for i in range(len(audio)):
                if abs(audio[i]) < threshold:
                    audio[i] = audio[i] * 0.3
            
            # Stage 5: Median filtering (remove clicks)
            audio = median_filter(audio, size=3)
            
            # Stage 6: Adaptive gain
            rms = np.sqrt(np.mean(audio**2))
            if rms < 0.05:
                gain = min(0.25 / (rms + 1e-6), 5.0)
                audio = audio * gain
            
            # Stage 7: Dynamic range compression
            threshold = 0.4
            ratio = 3.0
            audio_abs = np.abs(audio)
            mask = audio_abs > threshold
            if np.any(mask):
                audio[mask] = np.sign(audio[mask]) * (threshold + (audio_abs[mask] - threshold) / ratio)
            
            # Stage 8: Speech frequency boost
            b, a = signal.butter(2, [300, 3400], btype='band', fs=sr)
            speech_boost = signal.filtfilt(b, a, audio)
            audio = 0.7 * speech_boost + 0.3 * audio
            
            # Stage 9: Normalize
            max_val = np.max(np.abs(audio))
            if max_val > 0:
                audio = audio / max_val
            
            # Stage 10: Clipping prevention
            audio = np.clip(audio, -0.99, 0.99)
            
            # Save enhanced audio
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                sf.write(tmp.name, audio, sr)
                return tmp.name
                
        except Exception as e:
            logger.warning(f"Noise reduction skipped: {e}")
            return audio_path