import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Book, Chapter } from '../lib/store';
import { getBookById, getChaptersByBookId } from '../lib/catalog';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BookPdfModal } from '../components/BookPdfModal';
import { CitationBox } from '../components/CitationBox';
import { ChapterList } from '../components/ChapterList';
import {
  ArrowLeft,
  Download,
  BookOpen,
  Calendar,
  Hash,
  Share2,
  ExternalLink,
  Award,
  ShieldCheck,
  Eye,
  Check,
  Copy,
  Globe,
  MapPin,
  Building,
  Tag,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { formatDoiUrl, formatOrcidUrl } from '../utils/validators';

export function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // PDF Reader Modal state
  const [activePdfModal, setActivePdfModal] = useState<{
    isOpen: boolean;
    title: string;
    pdfUrl: string;
  }>({
    isOpen: false,
    title: '',
    pdfUrl: '',
  });

  const [linkCopied, setLinkCopied] = useState(false);
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const foundBook = await getBookById(id);
        if (foundBook) {
          setBook(foundBook);
          document.title = `${foundBook.title} | Observatório Edições`;

          // Inject Academic Highwire & Schema.org JSON-LD metadata for Google Scholar
          injectAcademicMetadata(foundBook);

          // Fetch linked chapters
          const chaptersData = await getChaptersByBookId(id);
          setChapters(chaptersData);
        } else {
          navigate('/publicacoes');
        }
      } catch (err) {
        console.error('Error fetching book details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      // Clean up injected script
      const script = document.getElementById('academic-jsonld');
      if (script) script.remove();
    };
  }, [id, navigate]);

  const injectAcademicMetadata = (b: Book) => {
    // Schema.org JSON-LD
    const oldScript = document.getElementById('academic-jsonld');
    if (oldScript) oldScript.remove();

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      'name': b.title,
      'headline': b.subtitle || b.title,
      'author': (b.authors || b.organizers || '').split(';').map(n => ({
        '@type': 'Person',
        'name': n.trim(),
      })),
      'datePublished': b.publicationDate || `${b.year}-01-01`,
      'inLanguage': b.language || 'pt-BR',
      'publisher': {
        '@type': 'Organization',
        'name': b.publisher || 'Observatório Edições',
        'url': window.location.origin,
      },
      'isbn': b.isbn || b.isbnDigital,
      'description': b.abstract || b.synopsis,
      'image': b.coverUrl,
    };

    const script = document.createElement('script');
    script.id = 'academic-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  };

  const handleShare = async () => {
    const shareData = {
      title: book?.title || 'Observatório Edições',
      text: `${book?.title} — Publicação Acadêmica em Acesso Aberto`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or unsupported
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-700">Carregando dados da obra...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-8 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb / Back button */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/publicacoes"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
            >
              <ArrowLeft size={14} />
              Voltar ao Catálogo de Publicações
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors"
            >
              {linkCopied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  Link Copiado!
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  Compartilhar Obra
                </>
              )}
            </button>
          </div>

          {/* Main Book Presentation Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Left Column: Cover & Primary Direct Actions */}
              <div className="lg:col-span-4 bg-slate-50/70 p-6 sm:p-8 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-slate-200/80">
                
                {/* 3D-styled Book Container */}
                {book.pdfUrl || book.downloadLink ? (
                  <a
                    href={book.pdfUrl || book.downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Clique para baixar ou abrir o livro completo (PDF)"
                    className="w-full max-w-[260px] aspect-[1/1.42] bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden relative mb-6 flex items-center justify-center p-2 group cursor-pointer hover:border-blue-500 hover:shadow-xl transition-all"
                  >
                    {book.type && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                          {book.type}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-950/10 transition-colors z-20 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5">
                        <Download size={13} /> Baixar / Abrir PDF
                      </span>
                    </div>

                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={`Capa de ${book.title}`}
                        className="max-h-full max-w-full object-contain rounded shadow-xs transition-transform duration-300 group-hover:scale-102"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 p-6 text-center">
                        <BookOpen size={72} strokeWidth={1} />
                        <span className="text-xs text-slate-400 mt-2 font-medium">Observatório Edições</span>
                      </div>
                    )}
                  </a>
                ) : (
                  <div className="w-full max-w-[260px] aspect-[1/1.42] bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden relative mb-6 flex items-center justify-center p-2 group">
                    {book.type && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                          {book.type}
                        </span>
                      </div>
                    )}

                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={`Capa de ${book.title}`}
                        className="max-h-full max-w-full object-contain rounded shadow-xs transition-transform duration-300 group-hover:scale-102"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 p-6 text-center">
                        <BookOpen size={72} strokeWidth={1} />
                        <span className="text-xs text-slate-400 mt-2 font-medium">Observatório Edições</span>
                      </div>
                    )}
                  </div>
                )}

                  {/* Primary Action Buttons */}
                  <div className="w-full space-y-2.5">
                    {(book.pdfUrl || book.downloadLink) && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActivePdfModal({
                            isOpen: true,
                            title: book.title,
                            pdfUrl: book.pdfUrl || book.downloadLink || '',
                          })}
                          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                        >
                          <Eye size={18} />
                          Leitura On-line Integrada
                        </button>

                        <a
                          href={book.pdfUrl || book.downloadLink}
                          download={`${book.title}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-white hover:bg-slate-100 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-300 shadow-2xs transition-all"
                        >
                          <Download size={16} />
                          Download do Livro Completo (PDF)
                        </a>
                      </>
                    )}

                  {/* DOI Link */}
                  {book.doi && (
                    <a
                      href={formatDoiUrl(book.doi)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl text-xs flex items-center justify-between gap-2 shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                          DOI
                        </span>
                        <span className="truncate text-slate-200 group-hover:text-white font-mono text-[11px]">
                          {book.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')}
                        </span>
                      </div>
                      <ExternalLink size={14} className="text-slate-400 group-hover:text-white shrink-0 transition-colors" />
                    </a>
                  )}
                </div>

              </div>

              {/* Right Column: Metadata, Abstract, Authors, Bibliographic Specs */}
              <div className="lg:col-span-8 p-6 sm:p-10 flex flex-col justify-between">
                <div>
                  
                  {/* Collection Badge */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {book.collection && (
                      <span className="bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1">
                        <Layers size={13} className="text-slate-500" />
                        Coleção: {book.collection}
                      </span>
                    )}
                    {book.volume && (
                      <span className="text-xs text-slate-500 font-medium">
                        Volume {book.volume}
                      </span>
                    )}
                  </div>

                  {/* Main Title & Subtitle */}
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-2 font-classical">
                    {book.title}
                  </h1>
                  {book.subtitle && (
                    <h2 className="text-base sm:text-lg font-medium text-slate-600 font-editorial italic mb-4 leading-normal">
                      {book.subtitle}
                    </h2>
                  )}

                  {/* Authors / Organizers presentation with ORCID */}
                  <div className="mb-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {book.type === 'Coletânea' ? 'Coletânea' : 'Autoria'}
                    </span>
                    
                    {book.contributors && book.contributors.length > 0 ? (
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {book.contributors.map((contrib, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-slate-800">{contrib.name}</span>
                            {contrib.orcid && (
                              <a
                                href={formatOrcidUrl(contrib.orcid)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`ORCID de ${contrib.name}`}
                                className="inline-flex items-center hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src="/assets/aistudio/orcid_0fbf4844.svg"
                                  alt="ORCID iD"
                                  className="w-4 h-4"
                                />
                              </a>
                            )}
                            {contrib.institution && (
                              <span className="text-slate-600 text-xs inline-flex items-center gap-1.5 ml-1">
                                <span>({contrib.institution}</span>
                                {contrib.institutionRor ? (
                                  <a
                                    href={contrib.institutionRor}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`Registro ROR oficial de ${contrib.institution}`}
                                    className="inline-flex items-center hover:opacity-75 transition-opacity align-middle"
                                  >
                                    <img
                                      src="/assets/aistudio/ror-logo-800_4f970d3b.svg"
                                      alt="ROR ID"
                                      className="h-3.5 w-auto object-contain inline-block"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={`https://ror.org/search?query=${encodeURIComponent(contrib.institution)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`Buscar registro ROR de ${contrib.institution}`}
                                    className="inline-flex items-center hover:opacity-75 transition-opacity align-middle"
                                  >
                                    <img
                                      src="/assets/aistudio/ror-logo-800_4f970d3b.svg"
                                      alt="ROR"
                                      className="h-3.5 w-auto object-contain inline-block"
                                    />
                                  </a>
                                )}
                                <span>)</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-slate-800">
                        {book.authors || book.organizers}
                      </p>
                    )}
                  </div>

                  {/* Synopsis / Presentation */}
                  {book.synopsis && (
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Apresentação da Obra
                      </h4>
                      <p className="text-sm text-slate-700 font-editorial leading-relaxed">
                        {book.synopsis}
                      </p>
                    </div>
                  )}

                  {/* Academic Abstract */}
                  {book.abstract && (
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Resumo Acadêmico
                      </h4>
                      <div className="relative">
                        <p className={`text-sm text-slate-600 font-editorial leading-relaxed whitespace-pre-wrap ${
                          !isAbstractExpanded ? 'line-clamp-4' : ''
                        }`}>
                          {book.abstract}
                        </p>
                        {book.abstract.length > 280 && (
                          <button
                            type="button"
                            onClick={() => setIsAbstractExpanded(!isAbstractExpanded)}
                            className="mt-1 text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                          >
                            {isAbstractExpanded ? 'Ler menos' : 'Ler resumo completo'}
                            <ChevronDown size={14} className={isAbstractExpanded ? 'rotate-180' : ''} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  {book.keywords && book.keywords.length > 0 && (
                    <div className="mb-8">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Palavras-chave
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {book.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 transition-colors"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bibliographic Specifications Table */}
                  <div className="mb-8">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Ficha Catalográfica e Especificações Técnicas
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Ano de Publicação</span>
                        <span className="font-bold text-slate-800">{book.year}</span>
                      </div>

                      {book.isbn && (
                        <div>
                          <span className="text-slate-400 block text-[11px]">ISBN Impresso</span>
                          <span className="font-semibold text-slate-800">{book.isbn}</span>
                        </div>
                      )}

                      {book.isbnDigital && (
                        <div>
                          <span className="text-slate-400 block text-[11px]">ISBN Digital</span>
                          <span className="font-semibold text-slate-800">{book.isbnDigital}</span>
                        </div>
                      )}

                      {book.pages && (
                        <div>
                          <span className="text-slate-400 block text-[11px]">Páginas</span>
                          <span className="font-semibold text-slate-800">{book.pages} p.</span>
                        </div>
                      )}

                      <div>
                        <span className="text-slate-400 block text-[11px]">Edição</span>
                        <span className="font-semibold text-slate-800">{book.edition || '1ª edição'}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Idioma</span>
                        <span className="font-semibold text-slate-800">{book.language || 'Português'}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Editora</span>
                        <span className="font-semibold text-slate-800">{book.publisher || 'Observatório Edições'}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Local de Publicação</span>
                        <span className="font-semibold text-slate-800">{book.publicationCity || 'Palmas - TO, Brasil'}</span>
                      </div>

                      <div className="sm:col-span-3 pt-2 border-t border-slate-200/80">
                        <span className="text-slate-400 block text-[11px]">Licença Editorial</span>
                        <span className="font-medium text-slate-700">
                          {book.license || 'Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Citation Component */}
                {/* Citation component removed per user request */}

              </div>

            </div>
          </div>

          {/* Linked Chapters Section */}
          <ChapterList
            chapters={chapters}
            onReadChapter={(chapter) => {
              if (chapter.pdfUrl) {
                setActivePdfModal({
                  isOpen: true,
                  title: `${chapter.title} — ${book.title}`,
                  pdfUrl: chapter.pdfUrl,
                });
              }
            }}
          />

        </div>
      </main>

      <Footer />

      {/* Online PDF Reader Modal */}
      <BookPdfModal
        isOpen={activePdfModal.isOpen}
        onClose={() => setActivePdfModal({ isOpen: false, title: '', pdfUrl: '' })}
        title={activePdfModal.title}
        pdfUrl={activePdfModal.pdfUrl}
      />
    </div>
  );
}
