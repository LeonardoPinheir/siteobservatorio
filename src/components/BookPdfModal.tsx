import React from 'react';
import { X, Download, ExternalLink, BookOpen, AlertCircle } from 'lucide-react';

interface BookPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
}

export const BookPdfModal: React.FC<BookPdfModalProps> = ({
  isOpen,
  onClose,
  title,
  pdfUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/50">
        
        {/* Top Header Toolbar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden pr-4">
            <BookOpen size={20} className="text-blue-400 shrink-0" />
            <h3 id="pdf-modal-title" className="text-sm font-semibold truncate text-slate-100">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={pdfUrl}
              download={`${title}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Baixar PDF</span>
            </a>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir em nova aba"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <ExternalLink size={18} />
            </a>

            <button
              onClick={onClose}
              aria-label="Fechar leitor"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PDF Reader Area */}
        <div className="flex-1 bg-slate-100 relative">
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-full"
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
              <AlertCircle size={48} className="text-amber-600 mb-4" />
              <h4 className="text-lg font-bold text-slate-800 mb-2">
                Visualização integrada não suportada pelo navegador
              </h4>
              <p className="text-sm text-slate-600 max-w-md mb-6">
                Seu navegador não suporta visualização direta de arquivos PDF ou bloqueou o leitor embutido. Você pode baixar o arquivo ou abri-lo diretamente.
              </p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Baixar ou Abrir PDF Agora
              </a>
            </div>
          </object>
        </div>

      </div>
    </div>
  );
};
