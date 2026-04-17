import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Square, Loader2, Copy, Download, Languages, 
  Trash2, History, Sparkles, Globe, LogOut, X, Upload,
  Menu, MessageSquare, Settings, User, Bell,
  Search, ChevronDown, Zap, Shield, MicOff, Activity, 
  ArrowRightLeft, Palette, LayoutGrid, Columns, Moon, Sun, Cloud, Flame,
  Plus, Cpu
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { api } from './services/api';

const themes = {
  gemini: {
    name: 'Gemini', icon: <Sparkles className="w-4 h-4" />,
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    surface: 'rgba(255,255,255,0.08)', surfaceHover: 'rgba(255,255,255,0.15)',
    text: '#ffffff', textSecondary: '#a0a0c0', border: 'rgba(255,255,255,0.1)',
    accent: '#6366f1', success: '#10b981', error: '#ef4444', warning: '#f59e0b'
  },
  dark: {
    name: 'Dark', icon: <Moon className="w-4 h-4" />,
    background: '#0a0a0a', surface: '#1a1a1a', surfaceHover: '#2a2a2a',
    text: '#ffffff', textSecondary: '#a0a0a0', border: '#2a2a2a',
    accent: '#3b82f6', success: '#22c55e', error: '#ef4444', warning: '#f59e0b'
  },
  ninja: {
    name: 'Ninja', icon: <Shield className="w-4 h-4" />,
    background: '#1a1a1a', surface: '#2d2d2d', surfaceHover: '#3d3d3d',
    text: '#e0e0e0', textSecondary: '#909090', border: '#3d3d3d',
    accent: '#d4af37', success: '#00ff88', error: '#ff4444', warning: '#ffaa00'
  },
  northpole: {
    name: 'North Pole', icon: <Cloud className="w-4 h-4" />,
    background: 'linear-gradient(135deg, #e8f4f8 0%, #d4eaf0 50%, #c0e0e8 100%)',
    surface: 'rgba(255,255,255,0.9)', surfaceHover: 'rgba(255,255,255,1)',
    text: '#1a3a4a', textSecondary: '#4a6a7a', border: '#c0d4dc',
    accent: '#00b4d8', success: '#2ecc71', error: '#e74c3c', warning: '#f39c12'
  },
  apocalypse: {
    name: 'Apocalypse', icon: <Flame className="w-4 h-4" />,
    background: 'linear-gradient(135deg, #3d1a00 0%, #662200 50%, #993300 100%)',
    surface: 'rgba(0,0,0,0.5)', surfaceHover: 'rgba(0,0,0,0.7)',
    text: '#ffaa66', textSecondary: '#cc8844', border: '#993300',
    accent: '#ff4444', success: '#00ff88', error: '#ff4444', warning: '#ffaa00'
  }
};

type ThemeName = 'gemini' | 'dark' | 'ninja' | 'northpole' | 'apocalypse';

function App() {
  // Theme state
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('gemini');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const theme = themes[currentTheme];
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState<'login' | 'signup' | null>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  
  // App state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('hi');
  const [languages, setLanguages] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [noSpeechDetected, setNoSpeechDetected] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  
  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev].slice(0, 10));
    toast(msg);
  };
  
  useEffect(() => {
    fetchLanguages();
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      setUser({ username: localStorage.getItem('username'), email: localStorage.getItem('email') });
      fetchHistory();
    }
  }, []);
  
  const fetchLanguages = async () => {
    try {
      const data = await api.getLanguages();
      setLanguages(data.languages);
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      setLanguages({
        "auto": "🔍 Auto Detect", "hi": "🇮🇳 Hindi", "bn": "🇮🇳 Bengali",
        "te": "🇮🇳 Telugu", "mr": "🇮🇳 Marathi", "ta": "🇮🇳 Tamil",
        "ur": "🇮🇳 Urdu", "gu": "🇮🇳 Gujarati", "kn": "🇮🇳 Kannada",
        "ml": "🇮🇳 Malayalam", "en": "🇺🇸 English", "es": "🇪🇸 Spanish",
        "fr": "🇫🇷 French", "de": "🇩🇪 German"
      });
    }
  };
  
  const fetchHistory = async () => {
    try {
      const data = await api.getHistory();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };
  
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) { addNotification('Enter email and password'); return; }
    setIsLoggedIn(true);
    setUser({ username: loginEmail.split('@')[0], email: loginEmail });
    localStorage.setItem('token', 'demo');
    localStorage.setItem('username', loginEmail.split('@')[0]);
    localStorage.setItem('email', loginEmail);
    setShowAuth(null);
    addNotification('Welcome back!');
    fetchHistory();
  };
  
  const handleSignup = async () => {
    if (!signupEmail || !signupUsername || !signupPassword) { addNotification('Fill all fields'); return; }
    setIsLoggedIn(true);
    setUser({ username: signupUsername, email: signupEmail });
    localStorage.setItem('token', 'demo');
    localStorage.setItem('username', signupUsername);
    localStorage.setItem('email', signupEmail);
    setShowAuth(null);
    addNotification('Account created!');
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.clear();
    setTranscription('');
    addNotification('Logged out');
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setNoSpeechDetected(false);
      setDetectedLanguage(null);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processAudio(blob);
        }
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!isRecording) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(1, avg / 100));
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
      audioContext.resume();
      
      addNotification('Recording...');
    } catch (error) {
      addNotification('Microphone access denied');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      addNotification('Processing...');
    }
  };
  
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    const toastId = toast.loading('Transcribing...');
    
    try {
      const result = await api.transcribe(audioBlob, sourceLang);
      
      if (result.success && !result.no_speech && result.text) {
        setTranscription(result.text);
        setProcessingTime(result.processing_ms);
        setWordCount(result.words);
        
        if (sourceLang === 'auto' && result.language) {
          setDetectedLanguage(result.language);
          addNotification(`Detected: ${result.language.toUpperCase()}`);
        }
        
        toast.success(`✨ ${result.words} words in ${result.processing_ms}ms`, { id: toastId });
        
        if (targetLang !== 'auto' && targetLang !== result.language && result.text) {
          const translateResult = await api.translate(result.text, targetLang, result.language);
          if (translateResult.success && translateResult.translated_text) {
            setTranslation(translateResult.translated_text);
            setShowTranslation(true);
          }
        }
        
        await fetchHistory();
      } else {
        toast.error(result.error || 'No speech detected', { id: toastId });
        setNoSpeechDetected(true);
      }
    } catch (error) {
      toast.error('Failed to transcribe', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleTranslate = async () => {
    if (!transcription) { addNotification('No text to translate'); return; }
    
    setIsTranslating(true);
    const toastId = toast.loading('Translating...');
    try {
      const sourceLangCode = sourceLang === 'auto' ? (detectedLanguage || 'en') : sourceLang;
      const result = await api.translate(transcription, targetLang, sourceLangCode);
      if (result.success && result.translated_text) {
        setTranslation(result.translated_text);
        setShowTranslation(true);
        toast.success(`Translated to ${targetLang.toUpperCase()}`, { id: toastId });
      }
    } catch (error) {
      toast.error('Translation failed', { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };
  
  const downloadPDF = async () => {
    if (!transcription) { addNotification('No content to export'); return; }
    
    const toastId = toast.loading('Generating PDF...');
    try {
      const sourceLangCode = sourceLang === 'auto' ? (detectedLanguage || 'en') : sourceLang;
      const blob = await api.exportPDF(transcription, translation, sourceLangCode, targetLang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!', { id: toastId });
      addNotification('PDF downloaded');
    } catch (error) {
      toast.error('PDF failed', { id: toastId });
    }
  };
  
  const copyText = () => {
    navigator.clipboard.writeText(transcription);
    addNotification('Copied!');
  };
  
  const clearAll = () => {
    setTranscription('');
    setTranslation('');
    setShowTranslation(false);
    setProcessingTime(null);
    setWordCount(0);
    setNoSpeechDetected(false);
    setDetectedLanguage(null);
    addNotification('Cleared');
  };
  
  const handleSwapLanguages = () => {
    if (sourceLang !== 'auto') {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
      addNotification(`Swapped: ${sourceLang.toUpperCase()} ↔ ${targetLang.toUpperCase()}`);
    } else {
      addNotification('Cannot swap with Auto Detect');
    }
  };
  
  const languageList = Object.entries(languages);
  
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.background, fontFamily: 'Calibri, Segoe UI, sans-serif' }}>
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl transition-all duration-300 hover:scale-105 hover:opacity-90" style={{ background: theme.accent }}>
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 transition-all duration-300" style={{ color: theme.text }}>AI Powered<span style={{ color: theme.accent }}> STT</span></h1>
            <p style={{ color: theme.textSecondary }}>Advanced Speech-to-Text Technology</p>
          </div>
          
          <div className="rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl" style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '20px' }}>
            <div className="flex gap-3 mb-6">
              <button onClick={() => setShowAuth('login')} className={`flex-1 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:opacity-90 ${showAuth === 'login' ? 'text-white' : ''}`} style={showAuth === 'login' ? { background: theme.accent } : { background: theme.surfaceHover, color: theme.textSecondary }}>Login</button>
              <button onClick={() => setShowAuth('signup')} className={`flex-1 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:opacity-90 ${showAuth === 'signup' ? 'text-white' : ''}`} style={showAuth === 'signup' ? { background: theme.accent } : { background: theme.surfaceHover, color: theme.textSecondary }}>Sign Up</button>
            </div>
            
            {showAuth === 'login' && (
              <div className="space-y-4">
                <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 hover:opacity-90" style={{ background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '12px' }} />
                <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 hover:opacity-90" style={{ background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '12px' }} />
                <button onClick={handleLogin} className="w-full py-3 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 hover:opacity-90" style={{ background: theme.accent, borderRadius: '12px' }}>Continue</button>
              </div>
            )}
            
            {showAuth === 'signup' && (
              <div className="space-y-4">
                <input type="email" placeholder="Email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 hover:opacity-90" style={{ background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '12px' }} />
                <input type="text" placeholder="Username" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 hover:opacity-90" style={{ background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '12px' }} />
                <input type="password" placeholder="Password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 hover:opacity-90" style={{ background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '12px' }} />
                <button onClick={handleSignup} className="w-full py-3 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 hover:opacity-90" style={{ background: theme.accent, borderRadius: '12px' }}>Create Account</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen" style={{ background: theme.background, fontFamily: 'Calibri, Segoe UI, sans-serif' }}>
      <Toaster position="top-right" />
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-all duration-300">
          <div className="rounded-2xl p-6 w-96 shadow-2xl transition-all duration-300 hover:scale-105" style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '20px' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: theme.text }}>Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80" style={{ color: theme.textSecondary }}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm block mb-2" style={{ color: theme.text }}>Layout</label>
                <div className="flex gap-3">
                  <button onClick={() => setLayoutMode('vertical')} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 hover:opacity-90 ${layoutMode === 'vertical' ? 'text-white' : ''}`} style={layoutMode === 'vertical' ? { background: theme.accent } : { background: theme.surfaceHover, color: theme.textSecondary }}><LayoutGrid className="w-4 h-4" style={{ color: layoutMode === 'vertical' ? 'white' : theme.textSecondary }} /> Vertical</button>
                  <button onClick={() => setLayoutMode('horizontal')} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 hover:opacity-90 ${layoutMode === 'horizontal' ? 'text-white' : ''}`} style={layoutMode === 'horizontal' ? { background: theme.accent } : { background: theme.surfaceHover, color: theme.textSecondary }}><Columns className="w-4 h-4" style={{ color: layoutMode === 'horizontal' ? 'white' : theme.textSecondary }} /> Horizontal</button>
                </div>
              </div>
              <div>
                <label className="text-sm block mb-2" style={{ color: theme.text }}>Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(themes).map(([key, t]) => (
                    <button key={key} onClick={() => { setCurrentTheme(key as ThemeName); setShowSettings(false); addNotification(`Theme: ${t.name}`); }} className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:opacity-90" style={{ background: theme.surfaceHover, color: theme.text }}>{t.icon}{t.name}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 rounded-2xl shadow-xl z-50 transition-all duration-300 animate-in slide-in-from-right-5" style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '16px' }}>
          <div className="p-3 border-b" style={{ borderBottomColor: theme.border }}><h4 className="font-semibold" style={{ color: theme.text }}>Notifications</h4></div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? <div className="p-4 text-center" style={{ color: theme.textSecondary }}>No notifications</div> :
              notifications.map((notif, idx) => <div key={idx} className="p-3 border-b text-sm transition-all duration-300 hover:opacity-80" style={{ borderBottomColor: theme.border, color: theme.textSecondary }}>{notif}</div>)}
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full transition-all duration-300 z-30 flex flex-col ${showSidebar ? 'w-72' : 'w-20'}`} style={{ background: theme.surface, borderRight: `1px solid ${theme.border}` }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105 hover:opacity-90" style={{ background: theme.accent }}>
              <Cpu className="w-4 h-4 text-white" />
            </div>
            {showSidebar && <span style={{ color: theme.text, fontWeight: 'semibold' }}>AI Powered STT</span>}
          </div>
          <button onClick={() => setShowSidebar(!showSidebar)} className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80" style={{ color: theme.textSecondary, background: theme.surfaceHover }}><Menu className="w-4 h-4" /></button>
        </div>
        
        <div className="p-3">
          <button className="w-full py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 hover:opacity-90" style={{ background: theme.accent, borderRadius: '12px' }}><Plus className="w-4 h-4 text-white" />{showSidebar && "New Transcription"}</button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 space-y-1 mt-2">
          <div className="px-3 py-2">{showSidebar && <span className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Recent</span>}</div>
          {history.slice(0, 10).map((item, idx) => (
            <button key={idx} onClick={() => { setTranscription(item.text); setWordCount(item.words); addNotification('Loaded from history'); }} className="w-full text-left px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:opacity-80" style={{ color: theme.textSecondary, background: 'transparent' }}>
              <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4" style={{ color: theme.textSecondary }} />{showSidebar && <span className="text-sm truncate" style={{ color: theme.textSecondary }}>{item.text.substring(0, 40)}...</span>}</div>
            </button>
          ))}
        </div>
        
        <div className="p-4" style={{ borderTop: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 hover:opacity-90" style={{ background: theme.accent }}><span className="text-white text-sm font-medium">{user?.username?.[0]?.toUpperCase()}</span></div>
            {showSidebar && (<div className="flex-1"><p className="text-sm font-medium" style={{ color: theme.text }}>{user?.username}</p><p className="text-xs" style={{ color: theme.textSecondary }}>{user?.email}</p></div>)}
            <button onClick={handleLogout} className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80" style={{ color: theme.textSecondary, background: theme.surfaceHover }}><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className={`transition-all duration-300 ${showSidebar ? 'ml-72' : 'ml-20'}`}>
        <header className="sticky top-0 z-20 border-b transition-all duration-300" style={{ background: theme.surface, borderBottomColor: theme.border }}>
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowHistory(!showHistory)} className="p-2 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80" style={{ color: theme.textSecondary, background: theme.surfaceHover }}><History className="w-5 h-5" /></button>
              <div className="relative">
                <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 hover:opacity-90" style={{ background: theme.surfaceHover, color: theme.text, borderRadius: '10px' }}><Palette className="w-4 h-4" /><span className="text-sm">{themes[currentTheme].name}</span><ChevronDown className="w-3 h-3" /></button>
                {showThemeMenu && (
                  <div className="absolute top-full left-0 mt-1 rounded-lg shadow-lg z-50 w-48 transition-all duration-300" style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px' }}>
                    {Object.entries(themes).map(([key, t]) => (
                      <button key={key} onClick={() => { setCurrentTheme(key as ThemeName); setShowThemeMenu(false); addNotification(`Theme: ${t.name}`); }} className="w-full text-left px-4 py-2 text-sm transition-all duration-300 hover:opacity-80 hover:scale-105 flex items-center gap-2" style={{ color: theme.text, borderRadius: '8px' }}>{t.icon}{t.name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80" style={{ color: theme.textSecondary, background: theme.surfaceHover }}><Bell className="w-5 h-5" /></button>
              <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80" style={{ color: theme.textSecondary, background: theme.surfaceHover }}><Settings className="w-5 h-5" /></button>
            </div>
          </div>
        </header>
        
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2 transition-all duration-300" style={{ color: theme.text }}>Welcome back, {user?.username}!</h1>
            <p style={{ color: theme.textSecondary }}>AI-Powered Speech-to-Text • <Zap className="w-4 h-4 inline text-yellow-500" /> 1-2 second latency</p>
          </div>
          
          <div className="grid grid-cols-[1fr,auto,1fr] gap-3 mb-6">
            <div className="rounded-xl p-3 transition-all duration-300 hover:shadow-md hover:opacity-90" style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '16px' }}>
              <label className="text-xs mb-1 block" style={{ color: theme.textSecondary }}>Source</label>
              <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="w-full bg-transparent outline-none text-sm transition-all duration-300 hover:opacity-90" style={{ color: theme.text }}>
                {languageList.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
              {sourceLang === 'auto' && detectedLanguage && <p className="text-xs mt-1 transition-all duration-300" style={{ color: theme.success }}>Detected: {detectedLanguage.toUpperCase()}</p>}
            </div>
            
            <button onClick={handleSwapLanguages} className="self-center p-2 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80" style={{ color: theme.textSecondary, background: theme.surfaceHover, borderRadius: '12px' }}><ArrowRightLeft className="w-5 h-5" /></button>
            
            <div className="rounded-xl p-3 transition-all duration-300 hover:shadow-md hover:opacity-90" style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '16px' }}>
              <label className="text-xs mb-1 block" style={{ color: theme.textSecondary }}>Target</label>
              <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-full bg-transparent outline-none text-sm transition-all duration-300 hover:opacity-90" style={{ color: theme.text }}>
                {languageList.filter(([code]) => code !== 'auto').map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </div>
          </div>
          
          <div className={`grid gap-4 ${layoutMode === 'vertical' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {/* Transcription Card */}
            <div className="rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:opacity-95" style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '20px' }}>
              <div className="p-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300" style={{ background: `${theme.accent}20` }}><User className="w-4 h-4" style={{ color: theme.accent }} /></div><span className="font-medium" style={{ color: theme.text }}>Transcription</span></div>
                  <div className="flex gap-2">
                    <button onClick={copyText} disabled={!transcription} className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80 disabled:opacity-50" style={{ background: theme.surfaceHover, color: theme.textSecondary, borderRadius: '10px' }}><Copy className="w-4 h-4" /></button>
                    <button onClick={downloadPDF} disabled={!transcription} className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80 disabled:opacity-50" style={{ background: theme.surfaceHover, color: theme.textSecondary, borderRadius: '10px' }}><Download className="w-4 h-4" /></button>
                    <button onClick={clearAll} disabled={!transcription} className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80 disabled:opacity-50" style={{ background: theme.surfaceHover, color: theme.error, borderRadius: '10px' }}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
              <div className="p-5 min-h-[250px]">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 transition-all duration-300" style={{ color: theme.accent }} />
                    <p style={{ color: theme.textSecondary }}>Transcribing...</p>
                    <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>AI processing</p>
                  </div>
                ) : transcription ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs transition-all duration-300" style={{ color: theme.textSecondary }}>{processingTime}ms • {wordCount} words</span>
                      {detectedLanguage && sourceLang === 'auto' && <span className="text-xs px-2 py-0.5 rounded-full transition-all duration-300" style={{ background: `${theme.success}20`, color: theme.success }}>{detectedLanguage.toUpperCase()}</span>}
                    </div>
                    <p className="text-lg leading-relaxed whitespace-pre-wrap transition-all duration-300" style={{ color: theme.text }}>{transcription}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    {noSpeechDetected ? <MicOff className="w-12 h-12 mb-3 transition-all duration-300" style={{ color: theme.warning }} /> : <Mic className="w-12 h-12 mb-3 transition-all duration-300" style={{ color: theme.textSecondary }} />}
                    <p style={{ color: theme.textSecondary }}>{noSpeechDetected ? 'No speech detected' : 'Ready'}</p>
                    <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>Click the microphone and speak</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Translation Card */}
            {showTranslation && translation && (
              <div className="rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:opacity-95 animate-in slide-in-from-bottom-5" style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '20px' }}>
                <div className="p-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300" style={{ background: `${theme.success}20` }}><Globe className="w-4 h-4" style={{ color: theme.success }} /></div><span className="font-medium" style={{ color: theme.text }}>Translation ({targetLang.toUpperCase()})</span></div>
                    <button onClick={() => setShowTranslation(false)} className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80" style={{ background: theme.surfaceHover, color: theme.textSecondary, borderRadius: '10px' }}><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-5 min-h-[200px]">
                  {isTranslating ? <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin transition-all duration-300" style={{ color: theme.accent }} /></div> : <p className="text-lg leading-relaxed whitespace-pre-wrap transition-all duration-300" style={{ color: theme.textSecondary }}>{translation}</p>}
                </div>
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="mt-6 rounded-2xl p-4 shadow-sm transition-all duration-300 hover:shadow-md" style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '20px' }}>
            <div className="flex items-center gap-3">
              <button onClick={isRecording ? stopRecording : startRecording} disabled={isProcessing} className={`w-14 h-14 rounded-full transition-all duration-300 flex-shrink-0 flex items-center justify-center shadow-md ${isRecording ? 'animate-pulse' : 'hover:scale-110 hover:opacity-90'}`} style={{ background: isRecording ? '#ef4444' : theme.accent, borderRadius: '50%' }}>
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : isRecording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs transition-all duration-300" style={{ color: theme.textSecondary }}>Audio</span>
                  <span className="text-xs transition-all duration-300" style={{ color: theme.textSecondary }}>{isRecording ? 'Recording...' : 'Ready'}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden transition-all duration-300" style={{ background: theme.surfaceHover, borderRadius: '4px' }}>
                  <div className="h-full transition-all duration-100" style={{ width: `${audioLevel * 100}%`, background: theme.accent, borderRadius: '4px' }} />
                </div>
              </div>
              
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:opacity-80" style={{ background: theme.surfaceHover, color: theme.textSecondary, borderRadius: '50%' }}><Upload className="w-4 h-4" /></div>
                  <input type="file" accept="audio/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) await processAudio(file); }} className="hidden" />
                </label>
                <button onClick={handleTranslate} disabled={!transcription || isTranslating} className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:opacity-80 disabled:opacity-50" style={{ background: theme.surfaceHover, color: theme.success, borderRadius: '50%' }}><Languages className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1 transition-all duration-300 hover:opacity-80" style={{ color: theme.textSecondary }}><Zap className="w-3 h-3 text-yellow-500" /> 1-2 sec latency</span>
              <span className="flex items-center gap-1 transition-all duration-300 hover:opacity-80" style={{ color: theme.textSecondary }}><Shield className="w-3 h-3" style={{ color: theme.accent }} /> 25+ Languages</span>
              <span className="flex items-center gap-1 transition-all duration-300 hover:opacity-80" style={{ color: theme.textSecondary }}><Cpu className="w-3 h-3" style={{ color: theme.accent }} /> AI Powered</span>
            </div>
          </div>
        </div>
      </main>
      
      {/* History Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 transform transition-transform duration-300 z-50 shadow-xl ${showHistory ? 'translate-x-0' : 'translate-x-full'}`} style={{ background: theme.surface, borderLeft: `1px solid ${theme.border}`, borderRadius: '20px 0 0 20px' }}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold transition-all duration-300" style={{ color: theme.text }}>History</h3>
          <button onClick={() => setShowHistory(false)} className="p-1 rounded-lg transition-all duration-300 hover:scale-110 hover:opacity-80" style={{ color: theme.textSecondary }}><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto h-full pb-20">
          {history.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 mx-auto mb-3 transition-all duration-300" style={{ color: theme.textSecondary }} />
              <p style={{ color: theme.textSecondary }}>No history yet</p>
            </div>
          ) : (
            history.map((item, idx) => (
              <button key={idx} onClick={() => { setTranscription(item.text); setWordCount(item.words); setShowHistory(false); addNotification('Loaded from history'); }} className="w-full text-left p-4 transition-all duration-300 hover:scale-105 hover:opacity-90" style={{ borderBottom: `1px solid ${theme.border}` }}>
                <p className="text-sm line-clamp-2 transition-all duration-300" style={{ color: theme.text }}>{item.text.substring(0, 100)}...</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs transition-all duration-300" style={{ color: theme.textSecondary }}>{item.language?.toUpperCase()}</span>
                  <span className="text-xs transition-all duration-300" style={{ color: theme.textSecondary }}>{item.words} words</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      
      {showHistory && <div className="fixed inset-0 bg-black/20 z-40 transition-all duration-300" onClick={() => setShowHistory(false)} />}
    </div>
  );
}

export default App;
