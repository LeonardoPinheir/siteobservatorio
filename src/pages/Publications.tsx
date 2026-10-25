import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BookCard } from '../components/BookCard';
import { BookPdfModal } from '../components/BookPdfModal';
import { getBooks } from '../lib/catalog';
import type { Book } from '../lib/store';
import {
  Search,
  Filter,
  BookOpen,
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';

export function Publications() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'az' | 'za' | 'year_desc'>('recent');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Online PDF Reader Modal
  const [activePdfModal, setActivePdfModal] = useState<{
    isOpen: boolean;
    title: string;
    pdfUrl: string;
  }>({
    isOpen: false,
    title: '',
    pdfUrl: '',
  });

  const fetchCatalogBooks = async () => {
    setIsLoading(true);
    try {
      const booksData = await getBooks(true); // only published
      setBooks(booksData);
    } catch (err) {
      console.warn('Error fetching catalogue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogBooks();
    document.title = 'Catálogo de Publicações | Observatório Edições';

    window.addEventListener('booksUpdated', fetchCatalogBooks);
    return () => {
      window.removeEventListener('booksUpdated', fetchCatalogBooks);
    };
  }, []);

  // Filter options extraction
  const years = useMemo(() => {
    const unique = Array.from(new Set(books.map((b) => b.year).filter(Boolean)));
    return unique.sort((a, b) => Number(b) - Number(a));
  }, [books]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(books.map((b) => b.category).filter(Boolean)));
    return unique.sort();
  }, [books]);

  const publicationTypes = useMemo(() => {
    const unique = Array.from(new Set(books.map((b) => b.type).filter(Boolean)));
    return unique.sort();
  }, [books]);

  const collections = useMemo(() => {
    const unique = Array.from(new Set(books.map((b) => b.collection).filter(Boolean)));
    return unique.sort();
  }, [books]);

  const authors = useMemo(() => {
    const all = books.flatMap((b) => {
      const authStr = b.authors || b.organizers || '';
      return authStr.split(';').map((a) => a.trim());
    }).filter(Boolean);
    return Array.from(new Set(all)).sort();
  }, [books]);

  // Filtered and sorted books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          book.title?.toLowerCase().includes(query) ||
          book.subtitle?.toLowerCase().includes(query) ||
          book.abstract?.toLowerCase().includes(query) ||
          book.authors?.toLowerCase().includes(query) ||
          book.organizers?.toLowerCase().includes(query) ||
          (book.keywords && book.keywords.some((k) => k.toLowerCase().includes(query)));

        const matchesYear = !selectedYear || String(book.year) === selectedYear;
        const matchesCategory = !selectedCategory || book.category === selectedCategory;
        const matchesType = !selectedType || book.type === selectedType;
        const matchesCollection = !selectedCollection || book.collection === selectedCollection;
        const matchesAuthor =
          !selectedAuthor ||
          (book.authors && book.authors.includes(selectedAuthor)) ||
          (book.organizers && book.organizers.includes(selectedAuthor));

        return (
          matchesSearch &&
          matchesYear &&
          matchesCategory &&
          matchesType &&
          matchesCollection &&
          matchesAuthor
        );
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        }
        if (sortBy === 'year_desc') {
          return (b.year || 0) - (a.year || 0);
        }
        if (sortBy === 'az') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'za') {
          return b.title.localeCompare(a.title);
        }
        return 0;
      });
  }, [
    books,
    searchTerm,
    selectedYear,
    selectedCategory,
    selectedType,
    selectedCollection,
    selectedAuthor,
    sortBy,
  ]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedYear,
    selectedCategory,
    selectedType,
    selectedCollection,
    selectedAuthor,
    sortBy,
  ]);

  // Paginated books
  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE) || 1;
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBooks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  const hasActiveFilters =
    searchTerm ||
    selectedYear ||
    selectedCategory ||
    selectedType ||
    selectedCollection ||
    selectedAuthor;

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedYear('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedCollection('');
    setSelectedAuthor('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Banner */}
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-md">
              Catálogo Editorial Aberto
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2 font-classical">
              Publicações Acadêmicas e Científicas
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl font-editorial">
              Explore livros autorais, coletâneas e e-books produzidos por pesquisadores e docentes, com leitura on-line e download gratuito.
            </p>
          </div>

          {/* Search & Filters Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 mb-8">
            <div className="flex flex-col lg:flex-row items-center gap-4 mb-4">
              
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por título, resumo, autor ou palavras-chave..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <ArrowUpDown size={14} />
                  Ordenar:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="year_desc">Ano de Publicação</option>
                  <option value="az">Ordem Alfabética (A-Z)</option>
                  <option value="za">Ordem Alfabética (Z-A)</option>
                </select>
              </div>

            </div>

            {/* Filter Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
              
              {/* Year Filter */}
              <div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                >
                  <option value="">Todos os Anos</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                >
                  <option value="">Todos os Tipos</option>
                  {publicationTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Collection Filter */}
              <div>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                >
                  <option value="">Todas as Coleções</option>
                  {collections.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Author Filter */}
              <div>
                <select
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                >
                  <option value="">Todos os Autores</option>
                  {authors.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Filter Clearer */}
            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Exibindo {filteredBooks.length} de {books.length} obras cadastradas
                </span>
                <button
                  onClick={handleClearFilters}
                  className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                >
                  <X size={14} />
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </div>

          {/* Results Grid */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-500">Carregando catálogo editorial...</p>
            </div>
          ) : paginatedBooks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {paginatedBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onReadOnline={(b) => {
                      if (b.pdfUrl || b.downloadLink) {
                        setActivePdfModal({
                          isOpen: true,
                          title: b.title,
                          pdfUrl: b.pdfUrl || b.downloadLink || '',
                        });
                      }
                    }}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                          currentPage === page
                            ? 'bg-blue-700 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhuma publicação encontrada</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                Não foram encontrados livros com os termos e filtros selecionados. Tente ajustar os parâmetros de busca.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}

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
