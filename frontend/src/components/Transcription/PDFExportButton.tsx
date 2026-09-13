import React, { useState } from 'react';
import {
  Loader2,
  FileText,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

interface PDFExportButtonProps {
  originalText: string;
  translatedText?: string;
  sourceLang: string;
  targetLang?: string;

  /*
   * Kept as optional props for compatibility with
   * existing components that may still pass them.
   * They are not sent to the API.
   */
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
  buttonText = 'Download PDF',
  variant = 'primary',
  size = 'md',
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!originalText.trim()) {
      toast.error('No content to export');
      return;
    }

    setIsExporting(true);

    const toastId = toast.loading('Generating PDF...');

    try {
      /*
       * The backend /export-pdf endpoint accepts
       * exactly these four values.
       */
      const pdfBlob = await api.exportPDF(
        originalText,
        translatedText,
        sourceLang,
        targetLang
      );

      if (!(pdfBlob instanceof Blob)) {
        throw new Error('Invalid PDF response');
      }

      const url = window.URL.createObjectURL(pdfBlob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `transcript_${Date.now()}.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully!', {
        id: toastId,
      });
    } catch (error: any) {
      console.error('PDF export error:', error);

      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to generate PDF';

      toast.error(message, {
        id: toastId,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white',

    secondary:
      'bg-slate-700 hover:bg-slate-600 text-white',

    outline:
      'border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10',
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting || !originalText.trim()}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg
        flex
        items-center
        gap-2
        transition-all
        duration-300
        disabled:opacity-50
        disabled:cursor-not-allowed
        shadow-lg
      `}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}

      {isExporting ? 'Generating...' : buttonText}
    </button>
  );
};

export default PDFExportButton;