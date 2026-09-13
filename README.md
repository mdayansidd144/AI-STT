# AI-STT
minor-project(updated)
auth.py	Authentication	JWT token generation/verification, user login/signup, password hashing with bcrypt.
transcription.py	Transcription endpoint	Receives audio file, calls transcriber service, saves to database, returns result.
translation.py	Translation endpoint	Receives text, calls translation service, returns translated text.
export.py	PDF export endpoint	Creates PDF from transcription text, returns file for download.
adaptive.py	Learning endpoints	Saves corrections, retrieves learned patterns, provides learning statistics.
user.py	User endpoints	Returns user statistics (total transcriptions, words, accuracy).
🗄️ DATABASE MODELS
Model	Purpose	Fields
User	User accounts	id, email, username, hashed_password, total_transcriptions, avg_accuracy
Transcription	Transcription history	user_id, original_text, translated_text, detected_language, processing_time_ms, word_count
Correction	User corrections	user_id, original_text, corrected_text, language, pattern_type
AdaptivePattern	Learned patterns	user_id, pattern_key, original, corrected, frequency, confidence
🤖 AI MODULES - ONE LINE EXPLANATION
Module	AI Package	What it does in one line
Transcriber	Faster-Whisper	Converts speech audio to text using OpenAI's Whisper model optimized for speed.
Translation	Google Translate API	Translates text between 100+ languages using Google's neural machine translation.
Noise Reduction	SciPy + Librosa	Removes background noise (hiss, rumble, clicks) using signal processing filters.
Adaptive Learner	Custom pattern matching	Learns from user corrections and applies them to future transcriptions automatically.
Voice Activity Detection	WebRTC VAD	Detects when someone is actually speaking vs silence or background noise.
🔄 HOW AI MODULES WORK TOGETHER
text
User speaks → Audio captured → Noise reduction (audio_processor.py) → Whisper AI (transcriber.py) → Text output
                                                                                    │
                                                                                    ▼
User corrects text → Adaptive Learner (adaptive_learner.py) → Stores pattern → Future transcriptions improved
                                                                                    │
                                                                                    ▼
User clicks translate → Google Translate API (translation_service.py) → Translated text displayed
📊 WHERE IS THE DATASET?
There is NO external dataset in this project!

Unlike traditional AI training, this system:

Aspect	Explanation
No training data	Whisper model is pre-trained by OpenAI on 680,000 hours of multilingual audio data
No fine-tuning	The model is used as-is (base/tiny model)
Dataset location	The model weights are downloaded from Hugging Face / OpenAI servers when you first run pip install faster-whisper
User corrections	Become the "dataset" for adaptive learning (stored locally in SQLite)
Where the model comes from:

text
When you install faster-whisper, it downloads pre-trained weights from:
https://huggingface.co/guillaumekln/faster-whisper/tree/main
Size of downloaded models:

Model	Size
tiny	75 MB
base	150 MB
small	500 MB
medium	1.5 GB
large	3 GB
🆚 HOW THIS IS DIFFERENT FROM GOOGLE VOICE ASSISTANT
Feature	Google Voice Assistant	Your Project
Speech recognition	Cloud-based (audio sent to Google)	✅ Local (runs on your laptop)
Privacy	Audio sent to Google servers	✅ Audio never leaves your computer
Internet required	Yes, always	✅ No (transcription works offline)
Translation	Cloud-based	Cloud-based (Google Translate API)
Customization	Limited	✅ Full control
Cost	Free for personal	✅ Free forever
Offline support	Limited	✅ Full offline transcription
Data storage	Google stores your data	✅ You control all data
Self-learning	No (requires retraining)	✅ Learns from corrections instantly
📈 DATA FLOW DIAGRAM
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              COMPLETE DATA FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER INPUT
   ┌─────────┐
   │ Speak   │ ──► Microphone ──► Web Audio API ──► Audio Blob
   │ Upload  │ ──► File Input ──► FileReader ──► Audio Blob
   └─────────┘

2. FRONTEND PROCESSING
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ Audio Blob ──► FormData ──► Axios POST ──► /transcribe endpoint        │
   └─────────────────────────────────────────────────────────────────────────┘

3. BACKEND PROCESSING
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ Audio ──► Noise Reduction ──► Whisper Model ──► Text                    │
   │              │                    │                                      │
   │              ▼                    ▼                                      │
   │         cleaner audio      detected language + confidence              │
   └─────────────────────────────────────────────────────────────────────────┘

4. ADAPTIVE LEARNING
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ User corrects text ──► Save to SQLite ──► Pattern analysis             │
   │                              │                                           │
   │                              ▼                                           │
   │                     Update AdaptivePattern table                        │
   │                              │                                           │
   │                              ▼                                           │
   │                     Future transcriptions improved                     │
   └─────────────────────────────────────────────────────────────────────────┘

5. TRANSLATION (if requested)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ Text ──► Check cache ──► Google Translate API ──► Translated text     │
   │              │                                    │                      │
   │              ▼                                    ▼                      │
   │         cache hit (instant)              cache miss (1-2 sec)           │
   └─────────────────────────────────────────────────────────────────────────┘

6. RESPONSE
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ Backend ──► JSON response ──► Frontend display ──► User sees text      │
   └─────────────────────────────────────────────────────────────────────────┘
🎯 SUMMARY
Component	Technology	Role
Frontend	React + TypeScript	User interface, audio recording, API calls
Backend	FastAPI (Python)	API server, request handling
Speech-to-Text	Faster-Whisper	Converts audio to text locally
Translation	Google Translate API	Converts text between languages
Noise Reduction	SciPy + Librosa	Cleans audio before transcription
Adaptive Learning	SQLite + Pattern matching	Learns from user corrections
Database	SQLite	Stores users, transcriptions, corrections
Authentication	JWT + bcrypt	User login/signup
File Export	fpdf2	Creates PDF/text files
This project is completely self-contained, privacy-focused, and gets smarter with every correction! 🚀

main.py creates api server include(transcribe,translate,pdf_export) defines all the endpoints
using the CORS(cross-origin resource sharing)is a browser security features that restricts the web page from making the requests from different domain rather than which is being loaded
REST-API : representational state transfer) is an architectural principle that is use to design the network application such that  they can comminute over the server or the internet
transcriber : - faster-whisper : converts the audio speech into the text using open ai-whisper model 
transaltion : -Google API transfer : translate text using google machine neural network 
Noise reduction scipy+librosa : - remove the background noise using signal processing features 
Adaptive learning : - customer transcriptions : learn from the data and further implement for future data 
webRTCvad : detect actually someone is speaking or not 
config.py manages the stores settings like model,supported database ,jwt for the reacts the environment variables 
database.py  : Creates SQLite engine, session management, dynamic data storage helpers for adaptive learning.
there is no training data : because whisper-model is an openai model pretrained by openai around 600000 hours 
the model is used as base 