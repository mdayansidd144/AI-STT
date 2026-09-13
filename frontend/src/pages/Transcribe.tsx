import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Loader2,
  Upload,
  Copy,
  Download,
  Languages,
  Trash2,
  FileText,
  Globe,
  Shield,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';

interface TranscriptionResult {
  success: boolean;
  text?: string;
  language?: string;
  processing_ms?: number;
  words?: number;
  no_speech?: boolean;
  error?: string;
  transcription_id?: number;
}

const Transcribe: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('hi');
  const [languages, setLanguages] = useState<Record<string, string>>({});

  const [audioLevel, setAudioLevel] = useState(0);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [autoTranslate, setAutoTranslate] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const isRecordingRef = useRef(false);

  /*
   * Load available languages.
   */
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const data = await api.getLanguages();
        setLanguages(data.languages || {});
      } catch (error) {
        console.error('Failed to fetch languages:', error);
        toast.error('Unable to load languages');
      }
    };

    fetchLanguages();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  /*
   * Start microphone recording.
   */
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('Microphone recording is not supported by this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      let mimeType = '';

      const supportedMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];

      for (const type of supportedMimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const finalMimeType = recorder.mimeType || mimeType || 'audio/webm';

        const audioBlob = new Blob(audioChunksRef.current, {
          type: finalMimeType,
        });

        if (audioBlob.size < 5000) {
          toast.error(
            'Recording is too short. Please speak for at least 2–3 seconds.'
          );
          setIsProcessing(false);
          return;
        }

        await processAudio(audioBlob);
      };

      recorder.start(1000);

      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingDuration(0);

      /*
       * Recording timer.
       */
      timerRef.current = setInterval(() => {
        setRecordingDuration((previous) => previous + 1);
      }, 1000);

      /*
       * Audio level meter.
       */
      try {
        const AudioContextClass =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;

        if (AudioContextClass) {
          const audioContext = new AudioContextClass();

          audioContextRef.current = audioContext;

          const source =
            audioContext.createMediaStreamSource(stream);

          const analyser = audioContext.createAnalyser();

          analyser.fftSize = 256;

          source.connect(analyser);

          const dataArray = new Uint8Array(
            analyser.frequencyBinCount
          );

          const updateLevel = () => {
            if (!isRecordingRef.current) {
              setAudioLevel(0);
              return;
            }

            analyser.getByteFrequencyData(dataArray);

            const average =
              dataArray.reduce((sum, value) => sum + value, 0) /
              dataArray.length;

            setAudioLevel(Math.min(1, average / 100));

            animationFrameRef.current =
              requestAnimationFrame(updateLevel);
          };

          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          updateLevel();
        }
      } catch (audioLevelError) {
        console.warn(
          'Audio level meter unavailable:',
          audioLevelError
        );
      }

      toast.success('Recording started! Speak clearly.');
    } catch (error) {
      console.error('Microphone error:', error);

      toast.error(
        'Microphone access denied. Please allow microphone access and try again.'
      );
    }
  };

  /*
   * Stop recording.
   */
  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecordingRef.current) {
      return;
    }

    isRecordingRef.current = false;
    setIsRecording(false);
    setAudioLevel(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setRecordingDuration(0);
  };

  /*
   * Send audio to backend for transcription.
   */
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setShowTranslation(false);
    setTranslation('');
    setProcessingTime(null);
    setDetectedLanguage(null);

    const toastId = toast.loading('🎤 Transcribing audio...');

    try {
      const result: TranscriptionResult = await api.transcribe(
        audioBlob,
        selectedLanguage
      );

      if (!result.success) {
        toast.error(
          result.error || 'Transcription failed',
          { id: toastId }
        );
        return;
      }

      const text = result.text || '';
      const words = result.words || 0;
      const processingMs = result.processing_ms || 0;
      const language = result.language || selectedLanguage;

      if (!text.trim()) {
        toast.error(
          'No speech was detected. Please try speaking more clearly.',
          { id: toastId }
        );
        return;
      }

      setTranscription(text);
      setProcessingTime(processingMs);
      setWordCount(words);
      setDetectedLanguage(language);

      toast.success(
        `✨ ${words} words in ${processingMs}ms`,
        { id: toastId }
      );

      /*
       * Auto translation is handled as a separate API request.
       * The /transcribe endpoint only performs transcription.
       */
      if (
        autoTranslate &&
        targetLanguage &&
        targetLanguage !== language
      ) {
        try {
          setIsTranslating(true);

          const sourceLanguage =
            language === 'auto' ? 'en' : language;

          const translationResult = await api.translate(
            text,
            targetLanguage,
            sourceLanguage
          );

          if (translationResult.success) {
            setTranslation(
              translationResult.translated_text || ''
            );
            setShowTranslation(true);
          }
        } catch (translationError) {
          console.error(
            'Automatic translation failed:',
            translationError
          );
        } finally {
          setIsTranslating(false);
        }
      }
    } catch (error: any) {
      console.error('Transcription error:', error);

      toast.error(
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to transcribe audio',
        { id: toastId }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /*
   * Translate existing transcription.
   */
  const handleTranslate = async () => {
    if (!transcription.trim()) {
      toast.error('No text to translate');
      return;
    }

    if (!targetLanguage) {
      toast.error('Please select a target language');
      return;
    }

    setIsTranslating(true);

    const toastId = toast.loading(
      `Translating to ${targetLanguage.toUpperCase()}...`
    );

    try {
      const sourceLanguage =
        selectedLanguage === 'auto'
          ? detectedLanguage || 'en'
          : selectedLanguage;

      const result = await api.translate(
        transcription,
        targetLanguage,
        sourceLanguage
      );

      if (!result.success) {
        toast.error(
          result.error || 'Translation failed',
          { id: toastId }
        );
        return;
      }

      setTranslation(result.translated_text || '');
      setShowTranslation(true);

      toast.success(
        `Translated to ${targetLanguage.toUpperCase()}`,
        { id: toastId }
      );
    } catch (error: any) {
      console.error('Translation error:', error);

      toast.error(
        error?.response?.data?.detail ||
          error?.message ||
          'Translation failed',
        { id: toastId }
      );
    } finally {
      setIsTranslating(false);
    }
  };

  /*
   * Upload an audio file.
   */
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file.');
      event.target.value = '';
      return;
    }

    if (file.size < 5000) {
      toast.error(
        'File is too small. Please use a longer recording.'
      );
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(
        'File is too large. Maximum supported size is 10 MB.'
      );
      event.target.value = '';
      return;
    }

    await processAudio(file);

    event.target.value = '';
  };

  /*
   * Copy text.
   */
  const copyToClipboard = async (
    text: string,
    type: string
  ) => {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied!`);
    } catch (error) {
      console.error('Clipboard error:', error);
      toast.error('Unable to copy text.');
    }
  };

  /*
   * Clear transcription and translation.
   */
  const clearAll = () => {
    setTranscription('');
    setTranslation('');
    setShowTranslation(false);
    setProcessingTime(null);
    setWordCount(0);
    setDetectedLanguage(null);
    setRecordingDuration(0);
    setAudioLevel(0);

    toast.success('Cleared');
  };

  /*
   * Download PDF.
   */
  const downloadPDF = async () => {
    if (!transcription.trim()) {
      toast.error('No content to export');
      return;
    }

    const toastId = toast.loading('Generating PDF...');

    try {
      const sourceLanguage =
        selectedLanguage === 'auto'
          ? detectedLanguage || 'en'
          : selectedLanguage;

      const pdfBlob = await api.exportPDF(
        transcription,
        showTranslation ? translation : '',
        sourceLanguage,
        targetLanguage
      );

      const url = window.URL.createObjectURL(pdfBlob);

      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = `transcript_${Date.now()}.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded!', {
        id: toastId,
      });
    } catch (error: any) {
      console.error('PDF export error:', error);

      toast.error(
        error?.response?.data?.detail ||
          'Failed to generate PDF',
        { id: toastId }
      );
    }
  };

  /*
   * Format recording duration.
   */
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const languageList = Object.entries(languages);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Speech-to-Text
          </h1>

          <p className="text-gray-400 mt-1">
            Real-time transcription with noise reduction
          </p>
        </div>
      </div>

      {/* Language selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <label className="text-sm text-gray-400 mb-2 block">
            🎤 Source Language
          </label>

          <select
            value={selectedLanguage}
            onChange={(event) =>
              setSelectedLanguage(event.target.value)
            }
            className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
          >
            {languageList.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>

          <p className="text-xs text-gray-500 mt-1">
            Auto-detect will identify the language automatically.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <label className="text-sm text-gray-400 mb-2 block">
            🌍 Translate to
          </label>

          <div className="flex gap-2">
            <select
              value={targetLanguage}
              onChange={(event) =>
                setTargetLanguage(event.target.value)
              }
              className="flex-1 bg-slate-700 rounded-lg px-4 py-2 text-white"
            >
              {languageList
                .filter(([code]) => code !== 'auto')
                .map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
            </select>

            <button
              onClick={handleTranslate}
              disabled={!transcription || isTranslating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isTranslating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Languages className="w-4 h-4" />
              )}

              Translate
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="autoTranslate"
              checked={autoTranslate}
              onChange={(event) =>
                setAutoTranslate(event.target.checked)
              }
              className="rounded bg-slate-700 border-slate-600"
            />

            <label
              htmlFor="autoTranslate"
              className="text-sm text-gray-400"
            >
              Auto-translate after transcription
            </label>
          </div>
        </div>
      </div>

      {/* Audio recorder */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center gap-6">
          <button
            onClick={
              isRecording
                ? stopRecording
                : startRecording
            }
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full transition-all ${
              isRecording
                ? 'bg-red-600 animate-pulse'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-600'
            } ${
              isProcessing
                ? 'opacity-50'
                : 'hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-white" />
            ) : isRecording ? (
              <Square className="w-8 h-8 mx-auto text-white" />
            ) : (
              <Mic className="w-8 h-8 mx-auto text-white" />
            )}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-400" />

              <span className="text-xs text-emerald-400">
                Noise Reduction Active
              </span>
            </div>

            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-100"
                style={{
                  width: `${audioLevel * 100}%`,
                }}
              />
            </div>

            <div className="flex justify-between mt-2">
              <p className="text-sm text-gray-400">
                {isProcessing
                  ? '🔄 Processing audio...'
                  : isRecording
                  ? '🔴 Recording... Click to stop'
                  : '🎤 Click mic or upload audio'}
              </p>

              {isRecording && (
                <span className="text-sm text-red-400 font-mono">
                  {formatDuration(recordingDuration)}
                </span>
              )}
            </div>
          </div>

          <label className="cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:scale-105 transition">
              <Upload className="w-5 h-5 text-white" />
            </div>

            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>
            💡 Speak clearly for 2–3 seconds. Supports multiple
            languages.
          </p>

          <p className="mt-1 text-yellow-500">
            If not working, check the browser console (F12) for errors.
          </p>
        </div>
      </div>

      {/* Transcription result */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="bg-slate-800 px-5 py-3 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />

            <span className="text-white">
              Transcription
            </span>

            {detectedLanguage && (
              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                {detectedLanguage.toUpperCase()}
              </span>
            )}

            {wordCount > 0 && (
              <span className="text-xs text-gray-400">
                {wordCount} words
              </span>
            )}

            {processingTime !== null && (
              <span className="text-xs text-gray-400">
                {processingTime}ms
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                copyToClipboard(transcription, 'Text')
              }
              disabled={!transcription}
              className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-50"
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={downloadPDF}
              disabled={!transcription}
              className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-50"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={clearAll}
              className="p-1.5 hover:bg-red-600/20 rounded text-red-400"
              title="Clear"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 min-h-[200px]">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="relative">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />

                <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20" />
              </div>

              <p className="text-gray-400 mt-3">
                Applying noise reduction & transcribing...
              </p>

              <p className="text-xs text-gray-500 mt-1">
                This may take a few seconds
              </p>
            </div>
          ) : transcription ? (
            <div className="text-white text-lg leading-relaxed whitespace-pre-wrap">
              {transcription}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-12">
              <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />

              <p>
                Speak or upload audio to see transcription
              </p>

              <p className="text-sm mt-2">
                Click the microphone button and speak clearly
                for 2–3 seconds
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Translation result */}
      {showTranslation && translation && (
        <div className="mt-4 bg-emerald-900/30 rounded-2xl border border-emerald-500/30 overflow-hidden">
          <div className="bg-emerald-800/50 px-5 py-3 border-b border-emerald-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />

              <span className="text-white">
                Translation ({targetLanguage.toUpperCase()})
              </span>
            </div>

            <button
              onClick={() =>
                copyToClipboard(
                  translation,
                  'Translation'
                )
              }
              className="p-1.5 hover:bg-emerald-800 rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            <div className="text-emerald-100 text-lg whitespace-pre-wrap">
              {translation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transcribe;