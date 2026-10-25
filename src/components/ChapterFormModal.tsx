import React, { useState, useEffect } from 'react';
import { Chapter, Book, uploadFileWithProgress } from '../lib/store';
import { X, Check, FileText, Upload, AlertCircle } from 'lucide-react';
import { isValidDoi } from '../utils/validators';

interface ChapterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (chapterData: Omit<Chapter, 'id'>, id?: string) => Promise<void>;
  books: Book[];
  initialChapter?: Chapter | null;
  defaultBookId?: string;
}

export const ChapterFormModal: React.FC<ChapterFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  books,
  initialChapter,
  defaultBookId,
}) => {
  const [bookId, setBookId] = useState(defaultBookId || '');
  const [chapterNumber, setChapterNumber] = useState<number | string>(1);
  const [order, setOrder] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [abstractText, setAbstractText] = useState('');
  const [startPage, setStartPage] = useState<number | string>('');
  const [endPage, setEndPage] = useState<number | string>('');
  const [doi, setDoi] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [externalLink, setExternalLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialChapter) {
      setBookId(initialChapter.bookId);
      setChapterNumber(initialChapter.chapterNumber || 1);
      setOrder(initialChapter.order || 1);
      setTitle(initialChapter.title || '');
      setAuthors(initialChapter.authors || '');
      setAbstractText(initialChapter.abstract || '');
      setStartPage(initialChapter.startPage || '');
      setEndPage(initialChapter.endPage || '');
      setDoi(initialChapter.doi || '');
      setPdfUrl(initialChapter.pdfUrl || '');
      setExternalLink(initialChapter.externalLink || '');
    } else {
      setBookId(defaultBookId || (books[0]?.id || ''));
      setChapterNumber('');
      setOrder(1);
      setTitle('');
      setAuthors('');
      setAbstractText('');
      setStartPage('');
      setEndPage('');
      setDoi('');
      setPdfUrl('');
      setExternalLink('');
    }
    setPdfFile(null);
    setErrorMessage('');
  }, [initialChapter, defaultBookId, isOpen, books]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!bookId) {
      setErrorMessage('Selecione o livro de origem deste capítulo.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('O título do capítulo é obrigatório.');
      return;
    }
    if (!authors.trim()) {
      setErrorMessage('Informe os autores do capítulo.');
      return;
    }
    if (doi && !isValidDoi(doi)) {
      setErrorMessage('O DOI do capítulo está em formato inválido. Ex: 10.5281/zenodo.123456');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPdfUrl = pdfUrl;
      if (pdfFile) {
        finalPdfUrl = await uploadFileWithProgress(pdfFile, 'chapters_pdf');
      }

      await onSave({
        bookId,
        chapterNumber: chapterNumber || 1,
        order: Number(order) || 1,
        title: title.trim(),
        authors: authors.trim(),
        abstract: abstractText.trim(),
        startPage,
        endPage,
        doi: doi.trim(),
        pdfUrl: finalPdfUrl,
        externalLink: externalLink.trim(),
      }, initialChapter?.id);

      onClose();
    } catch (err: any) {
      console.error('Error saving chapter:', err);
      setErrorMessage(err.message || 'Falha ao salvar capítulo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-blue-400" />
            <h3 id="chapter-modal-title" className="text-base font-bold">
              {initialChapter ? 'Editar Capítulo' : 'Vincular Novo Capítulo'}
            </h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-1 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Livro de Origem <span className="text-rose-600">*</span>
            </label>
            <select
              required
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white font-medium"
            >
              <option value="">Selecione o livro...</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.year})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número do Capítulo
              </label>
              <input
                type="text"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(e.target.value)}
                placeholder="Ex.: 1 ou Cap. I"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ordem Editorial (sequência)
              </label>
              <input
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Título do Capítulo <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: A Comunicação Comunitária no Norte Brasileiro"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Autores do Capítulo <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="Ex.: Maria Silva; Carlos Santos"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pág. Inicial
              </label>
              <input
                type="text"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                placeholder="Ex.: 25"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pág. Final
              </label>
              <input
                type="text"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
                placeholder="Ex.: 48"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                DOI do Capítulo
              </label>
              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="10.5281/zenodo..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Resumo do Capítulo
            </label>
            <textarea
              rows={3}
              value={abstractText}
              onChange={(e) => setAbstractText(e.target.value)}
              placeholder="Breve resumo do conteúdo abordado neste capítulo..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-editorial leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Arquivo PDF Individual do Capítulo
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPdfFile(f);
                }}
                className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ou Link Externo do PDF
              </label>
              <input
                type="url"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://exemplo.com/capitulo.pdf"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check size={15} />
              {isSubmitting ? 'Salvando...' : 'Salvar Capítulo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
