import React from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { Download, BookOpen, ArrowRight, Eye, Calendar, Sparkles } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onReadOnline?: (book: Book) => void;
  variant?: 'default' | 'featured' | 'compact';
}

export const BookCard: React.FC<BookCardProps> = ({ book, onReadOnline, variant = 'default' }) => {
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  return (
    <article className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col h-full overflow-hidden">
      
      {/* Book Cover Container */}
      <div className="relative aspect-[1/1.42] bg-gradient-to-b from-slate-100 to-slate-200 overflow-hidden flex items-center justify-center p-3">
        {/* Type Badge */}
        {book.type && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase shadow-xs">
              {book.type}
            </span>
          </div>
        )}

        {/* Status Badge (if not Published, for admin preview) */}
        {book.status !== 'Publicado' && (
          <div className="absolute top-3 right-3 z-10">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${
              book.status === 'Rascunho' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
            }`}>
              {book.status}
            </span>
          </div>
        )}

        {/* Cover Image or Fallback */}
        <Link to={`/book/${book.id}`} className="w-full h-full flex items-center justify-center">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={`Capa de ${book.title}`}
              loading="lazy"
              className="max-h-full max-w-full object-contain rounded-md shadow-md group-hover:scale-103 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <BookOpen size={48} strokeWidth={1.5} className="mb-2 text-slate-300" />
              <span className="text-xs font-medium text-slate-500 line-clamp-2">{book.title}</span>
            </div>
          )}
        </Link>

        {/* Quick Read Button on Hover */}
        {(book.pdfUrl || book.downloadLink) && (
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex gap-2">
            {onReadOnline && (
              <button
                type="button"
                onClick={() => onReadOnline(book)}
                className="flex-1 bg-white/95 hover:bg-white text-slate-900 py-2 px-3 rounded-lg text-xs font-bold shadow-md backdrop-blur-xs flex items-center justify-center gap-1.5 transition-transform"
              >
                <Eye size={14} className="text-blue-600" />
                Ler On-line
              </button>
            )}
          </div>
        )}
      </div>

      {/* Book Metadata & Body */}
      <div className="p-5 flex flex-col flex-grow">
        
        {/* Knowledge Area & Year */}
        <div className="flex items-center justify-end text-[11px] text-slate-500 font-medium mb-2">
          <span className="flex items-center gap-1 text-slate-400">
            <Calendar size={12} />
            {book.year}
          </span>
        </div>

        {/* Title & Subtitle */}
        <Link to={`/book/${book.id}`} className="block group-hover:text-blue-700 transition-colors">
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-1">
            {book.title}
          </h3>
          {book.subtitle && (
            <p className="text-xs text-slate-500 font-editorial italic line-clamp-1 mb-2">
              {book.subtitle}
            </p>
          )}
        </Link>

        {/* Authors / Organizers */}
        <div className="text-xs text-slate-600 mb-3 mt-1">
          {book.authors ? (
            <p className="line-clamp-1">
              <span className="font-medium text-slate-800">{book.authors}</span>
            </p>
          ) : book.organizers ? (
            <p className="line-clamp-1">
              <span className="font-medium text-slate-800">{book.organizers}</span>
            </p>
          ) : null}
        </div>

        {/* Synopsis / Abstract Preview (Default variant only) */}
        {!isCompact && book.abstract && (
          <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed font-editorial">
            {book.abstract}
          </p>
        )}

        {/* Card Footer: Actions */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2">
          <Link
            to={`/book/${book.id}`}
            className="flex-1 bg-slate-900 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            Ver Detalhes
            <ArrowRight size={14} />
          </Link>

          {(book.pdfUrl || book.downloadLink) && (
            <a
              href={book.pdfUrl || book.downloadLink}
              download={`${book.title}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Baixar PDF de ${book.title}`}
              className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors"
              title="Baixar PDF"
            >
              <Download size={15} />
            </a>
          )}
        </div>

      </div>
    </article>
  );
};
