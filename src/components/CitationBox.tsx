import React, { useState } from 'react';
import { Copy, Check, Quote, FileCode, Download } from 'lucide-react';
import {
  CitationBookMetadata,
  generateAbntBookCitation,
  generateApaBookCitation,
  generateBibtexBookCitation,
} from '../utils/citations';

interface CitationBoxProps {
  book: CitationBookMetadata;
  bookId?: string;
}

export const CitationBox: React.FC<CitationBoxProps> = ({ book, bookId = 'obra' }) => {
  const [activeTab, setActiveTab] = useState<'abnt' | 'apa' | 'bibtex'>('abnt');
  const [copied, setCopied] = useState(false);

  const abntText = generateAbntBookCitation(book);
  const apaText = generateApaBookCitation(book);
  const bibtexText = generateBibtexBookCitation(book, bookId);

  const currentCitation = 
    activeTab === 'abnt' ? abntText :
    activeTab === 'apa' ? apaText : bibtexText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCitation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy citation:', err);
    }
  };

  const handleDownloadBibtex = () => {
    const blob = new Blob([bibtexText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `observatorio_${bookId.slice(0, 8)}.bib`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2 text-slate-900">
          <Quote className="text-blue-700 shrink-0" size={20} />
          <h3 className="font-bold text-base">Como citar esta obra</h3>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('abnt')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'abnt'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ABNT (NBR 6023)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apa')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'apa'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            APA 7ª ed.
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bibtex')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'bibtex'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            BibTeX
          </button>
        </div>
      </div>

      {/* Citation Content Box */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 font-editorial text-xs sm:text-sm text-slate-800 leading-relaxed overflow-x-auto select-all shadow-2xs">
        {activeTab === 'bibtex' ? (
          <pre className="font-mono text-xs whitespace-pre-wrap text-slate-800">
            {bibtexText}
          </pre>
        ) : (
          <p>{currentCitation}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-[11px] text-slate-400 font-medium">
          {activeTab === 'abnt' && 'Norma Brasileira ABNT NBR 6023:2018'}
          {activeTab === 'apa' && 'American Psychological Association (APA 7th Edition)'}
          {activeTab === 'bibtex' && 'Formato para gerenciadores de referências (Zotero, Mendeley)'}
        </span>

        <div className="flex items-center gap-2">
          {activeTab === 'bibtex' && (
            <button
              type="button"
              onClick={handleDownloadBibtex}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
            >
              <Download size={13} />
              Baixar .bib
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} />
                Copiado com sucesso!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copiar referência
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
