import React from 'react';
import { Chapter } from '../types';
import { FileText, Download, ExternalLink, Eye, ChevronRight } from 'lucide-react';

interface ChapterListProps {
  chapters: Chapter[];
  onReadChapter?: (chapter: Chapter) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({ chapters, onReadChapter }) => {
  if (chapters.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Capítulos da Obra</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sumário editorial com acesso individual aos capítulos
          </p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full border border-slate-200">
          {chapters.length} {chapters.length === 1 ? 'capítulo' : 'capítulos'}
        </span>
      </div>

      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {chapters.map((chapter, idx) => (
          <div
            key={chapter.id || idx}
            className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4 flex-1">
              {/* Chapter Badge */}
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 font-bold flex items-center justify-center shrink-0 text-sm border border-blue-100">
                {chapter.chapterNumber || idx + 1}
              </div>

              {/* Chapter Details */}
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 text-sm sm:text-base leading-snug">
                  {chapter.title}
                </h4>
                
                <p className="text-xs text-slate-600 font-medium">
                  {chapter.authors}
                </p>

                {chapter.abstract && (
                  <p className="text-xs text-slate-500 font-editorial line-clamp-2 pt-1 leading-relaxed">
                    {chapter.abstract}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                  {(chapter.startPage || chapter.endPage) && (
                    <span>Páginas: {chapter.startPage}–{chapter.endPage}</span>
                  )}
                  {chapter.doi && (
                    <a
                      href={chapter.doi.startsWith('http') ? chapter.doi : `https://doi.org/${chapter.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      DOI: {chapter.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Chapter Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {chapter.pdfUrl && onReadChapter && (
                <button
                  type="button"
                  onClick={() => onReadChapter(chapter)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Eye size={13} />
                  Ler
                </button>
              )}

              {chapter.pdfUrl && (
                <a
                  href={chapter.pdfUrl}
                  download={`${chapter.title}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-blue-700 transition-colors shadow-2xs"
                >
                  <Download size={13} />
                  PDF
                </a>
              )}

              {chapter.externalLink && !chapter.pdfUrl && (
                <a
                  href={chapter.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ExternalLink size={13} />
                  Acessar
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
