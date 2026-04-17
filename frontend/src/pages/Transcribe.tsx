import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Loader2, Upload, Copy, Download, Languages, Trash2, FileText, Globe, Zap, Activity, Shield, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Transcribe: React.FC = () => {
  const { user } = useAuth();
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
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const data = await api.getLanguages();
        setLanguages(data.languages);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      }
    };
    fetchLanguages();
  }, []);
  
  const addDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => prev + '\n' + new Date().toLocaleTimeString() + ': ' + message);
    setTimeout(() => setDebugInfo(prev => prev.slice(100)), 5000);
  };
  
  const startRecording = async () => {
    addDebug('Starting recording...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      addDebug('Microphone access granted');
      
      // Try different MIME types
      let mimeType = '';
      const mimeTypes = ['audio/webm', 'audio/wav', 'audio/mp4', 'audio/ogg'];
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          addDebug(`Using MIME type: ${type}`);
          break;
        }
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      setRecordingDuration(0);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          addDebug(`Data available: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        addDebug(`Recording stopped. Chunks: ${audioChunksRef.current.length}`);
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          addDebug(`Audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
          
          if (audioBlob.size < 5000) {
            addDebug('Audio too short!');
            toast.error('Recording too short. Please speak for at least 2-3 seconds.');
          } else {
            await processAudio(audioBlob);
          }
        }
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingDuration(0);
      };
      
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      addDebug('Recording started successfully');
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Audio level meter
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!isRecording) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(1, avg / 100));
        requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
      audioContext.resume();
      
      toast.success('Recording started! Speak clearly.');
      
    } catch (error) {
      addDebug(`Microphone error: ${error}`);
      console.error('Microphone error:', error);
      toast.error('Microphone access denied. Please allow microphone access.');
    }
  };
  
  const stopRecording = () => {
    addDebug('Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      if (timerRef.current) clearInterval(timerRef.current);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      toast.info('Recording stopped. Processing...');
    }
  };
  
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setShowTranslation(false);
    setTranslation('');
    const toastId = toast.loading('🎤 Transcribing audio...');
    addDebug(`Processing audio: ${audioBlob.size} bytes`);
    
    try {
      const translateTo = autoTranslate ? targetLanguage : '';
      addDebug(`Sending to backend - Language: ${selectedLanguage}, Translate to: ${translateTo}`);
      
      const result = await api.transcribe(audioBlob, selectedLanguage, translateTo, user?.id);
      
      addDebug(`Response received: ${JSON.stringify(result).substring(0, 200)}`);
      
      if (result.success) {
        setTranscription(result.text);
        setProcessingTime(result.processing_time_ms);
        setWordCount(result.word_count || 0);
        
        if (result.language && result.language !== 'auto') {
          setDetectedLanguage(result.language);
        }
        
        if (result.translated_text) {
          setTranslation(result.translated_text);
          setShowTranslation(true);
        }
        
        addDebug(`Transcription successful: ${result.word_count} words in ${result.processing_time_ms}ms`);
        toast.success(`✨ ${result.word_count || 0} words in ${result.processing_time_ms}ms`, { id: toastId });
      } else {
        addDebug(`Transcription failed: ${result.error}`);
        toast.error(result.error || 'Transcription failed', { id: toastId });
      }
    } catch (error: any) {
      addDebug(`Error: ${error.message}`);
      console.error('Transcription error:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to transcribe', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleTranslate = async () => {
    if (!transcription) {
      toast.error('No text to translate');
      return;
    }
    
    setIsTranslating(true);
    const toastId = toast.loading(`Translating to ${targetLanguage.toUpperCase()}...`);
    
    try {
      const sourceLang = selectedLanguage === 'auto' ? (detectedLanguage || 'en') : selectedLanguage;
      const result = await api.translate(transcription, sourceLang, targetLanguage);
      
      if (result.success) {
        setTranslation(result.translated_text);
        setShowTranslation(true);
        toast.success(`Translated to ${targetLanguage.toUpperCase()}`, { id: toastId });
      } else {
        toast.error('Translation failed', { id: toastId });
      }
    } catch (error) {
      toast.error('Translation failed', { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    addDebug(`File selected: ${file.name}, ${file.size} bytes, ${file.type}`);
    
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }
    
    if (file.size < 5000) {
      toast.error('File too small. Please use a longer recording.');
      return;
    }
    
    await processAudio(file);
  };
  
  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${type} copied!`);
  };
  
  const clearAll = () => {
    setTranscription('');
    setTranslation('');
    setShowTranslation(false);
    setProcessingTime(null);
    setWordCount(0);
    setDetectedLanguage(null);
    toast.success('Cleared');
  };
  
  const downloadPDF = async () => {
    if (!transcription) {
      toast.error('No content to export');
      return;
    }
    
    const toastId = toast.loading('Generating PDF...');
    try {
      const sourceLang = selectedLanguage === 'auto' ? (detectedLanguage || 'en') : selectedLanguage;
      const response = await api.exportPDF(
        transcription, 
        showTranslation ? translation : '', 
        sourceLang, 
        targetLanguage,
        processingTime || 0,
        wordCount,
        0
      );
      
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded!', { id: toastId });
    } catch (error) {
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const languageList = Object.entries(languages);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Speech-to-Text</h1>
          <p className="text-gray-400 mt-1">Real-time transcription with noise reduction</p>
        </div>
      </div>
      
      {/* Debug Panel */}
      {debugInfo && (
        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-yellow-400 text-xs font-mono whitespace-pre-wrap">{debugInfo}</p>
        </div>
      )}
      
      {/* Language Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <label className="text-sm text-gray-400 mb-2 block">🎤 Source Language</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
          >
            {languageList.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Auto-detect will identify language automatically</p>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <label className="text-sm text-gray-400 mb-2 block">🌍 Translate to</label>
          <div className="flex gap-2">
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="flex-1 bg-slate-700 rounded-lg px-4 py-2 text-white"
            >
              {languageList.filter(([code]) => code !== 'auto').map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            <button
              onClick={handleTranslate}
              disabled={!transcription || isTranslating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              Translate
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="autoTranslate"
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
              className="rounded bg-slate-700 border-slate-600"
            />
            <label htmlFor="autoTranslate" className="text-sm text-gray-400">Auto-translate after transcription</label>
          </div>
        </div>
      </div>
      
      {/* Audio Recorder */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center gap-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full transition-all ${
              isRecording ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-emerald-500 to-cyan-600'
            } ${isProcessing ? 'opacity-50' : 'hover:scale-105'}`}
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
              <span className="text-xs text-emerald-400">Noise Reduction Active</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm text-gray-400">
                {isProcessing ? '🔄 Processing audio...' : isRecording ? '🔴 Recording... Click to stop' : '🎤 Click mic or upload audio'}
              </p>
              {isRecording && (
                <span className="text-sm text-red-400 font-mono">{formatDuration(recordingDuration)}</span>
              )}
            </div>
          </div>
          
          <label className="cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:scale-105 transition">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>💡 Speak clearly for 2-3 seconds. Supports 55+ languages with noise reduction.</p>
          <p className="mt-1 text-yellow-500">If not working, check browser console (F12) for errors</p>
        </div>
      </div>
      
      {/* Transcription Result */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="bg-slate-800 px-5 py-3 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-white">Transcription</span>
            {detectedLanguage && (
              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                {detectedLanguage.toUpperCase()}
              </span>
            )}
            {wordCount > 0 && (
              <span className="text-xs text-gray-400">{wordCount} words</span>
            )}
            {processingTime && (
              <span className="text-xs text-gray-400">{processingTime}ms</span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => copyToClipboard(transcription, 'Text')} disabled={!transcription} className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-50" title="Copy">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={downloadPDF} disabled={!transcription} className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-50" title="Download PDF">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={clearAll} className="p-1.5 hover:bg-red-600/20 rounded text-red-400" title="Clear">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="p-6 min-h-[200px]">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="relative">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20"></div>
              </div>
              <p className="text-gray-400 mt-3">Applying noise reduction & transcribing...</p>
              <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
            </div>
          ) : transcription ? (
            <div className="text-white text-lg leading-relaxed whitespace-pre-wrap">
              {transcription}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-12">
              <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Speak or upload audio to see transcription</p>
              <p className="text-sm mt-2">Click the microphone button and speak clearly for 2-3 seconds</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Translation Result */}
      {showTranslation && translation && (
        <div className="mt-4 bg-emerald-900/30 rounded-2xl border border-emerald-500/30 overflow-hidden">
          <div className="bg-emerald-800/50 px-5 py-3 border-b border-emerald-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-white">Translation ({targetLanguage.toUpperCase()})</span>
            </div>
            <button onClick={() => copyToClipboard(translation, 'Translation')} className="p-1.5 hover:bg-emerald-800 rounded">
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