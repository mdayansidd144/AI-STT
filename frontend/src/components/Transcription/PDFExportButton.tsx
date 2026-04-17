import React, { useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

interface PDFExportButtonProps {
  originalText: string;
  translatedText?: string;
  sourceLang: string;
  targetLang?: string;
  processingTimeMs?: number;
  wordCount?: number;
  accuracyScore?: number;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  originalText,
  translatedText = '',
  sourceLang,
  targetLang = '',
  processingTimeMs = 0,
  wordCount = 0,
  accuracyScore = 0,
  buttonText = 'Download PDF',
  variant = 'primary',
  size = 'md'
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!originalText || originalText.trim() === '') {
      toast.error('No content to export');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('Generating PDF...');

    try {
      const response = await api.exportPDF(
        originalText,
        translatedText,
        sourceLang,
        targetLang,
        processingTimeMs,
        wordCount,
        accuracyScore
      );

      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (error) {
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    outline: 'border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10'
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || !originalText}
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-lg flex items-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      {buttonText}
    </button>
  );
};

export default PDFExportButton;