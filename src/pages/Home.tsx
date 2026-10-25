import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BookCard } from '../components/BookCard';
import { CallCard } from '../components/CallCard';
import { BookPdfModal } from '../components/BookPdfModal';
import {
  getBooks,
  getCalls,
  getTeam,
  getCollections,
  getSubmissionTemplate,
} from '../lib/catalog';
import {
  addMessage,
  Book,
  Call,
  TeamMember,
  EditorialCollection,
  SubmissionTemplate,
} from '../lib/store';
import {
  ArrowRight,
  BookOpen,
  FileText,
  Send,
  Users,
  Mail,
  MapPin,
  ExternalLink,
  Download,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';

export function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [collections, setCollections] = useState<EditorialCollection[]>([]);
  const [template, setTemplate] = useState<SubmissionTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // PDF Reader Modal
  const [activePdfModal, setActivePdfModal] = useState<{
    isOpen: boolean;
    title: string;
    pdfUrl: string;
  }>({
    isOpen: false,
    title: '',
    pdfUrl: '',
  });

  // Featured Carousel Ref
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Contact form state
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Dúvida sobre publicação e submissão',
    message: '',
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setFormStatus('submitting');
    try {
      await addMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        content: formData.message.trim(),
      });
      setFormStatus('success');
      setFormData({ name: '', email: '', subject: 'Dúvida sobre publicação e submissão', message: '' });
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (err) {
      console.error('Error submitting message:', err);
      setFormStatus('error');
    }
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        const [booksData, callsData, teamData, collectionsData, templateData] = await Promise.all([
          getBooks(true), // only published
          getCalls(),
          getTeam(),
          getCollections(),
          getSubmissionTemplate(),
        ]);

        setBooks(booksData);
        // Featured books: explicit isFeatured or recent 4
        const featured = booksData.filter(b => b.isFeatured);
        setFeaturedBooks(featured.length > 0 ? featured : booksData.slice(0, 4));
        setCalls(callsData);
        setTeam(teamData);
        setCollections(collectionsData);
        setTemplate(templateData);
      } catch (err) {
        console.warn('Error loading home data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
    document.title = 'Observatório Edições | Portal Editorial Acadêmico';

    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        
        {/* ======================================================== */}
        {/* HERO SECTION / BANNER INSTITUCIONAL */}
        {/* ======================================================== */}
        <section className="relative bg-[#0c2338] text-white py-8 lg:py-12 overflow-hidden">
          {/* Subtle geometric & grid background accent */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6 font-classical">
                Conhecimento Científico e Produção Acadêmica em{' '}
                <span className="text-blue-400">Acesso Aberto</span>.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-editorial mb-8">
                O <strong>Observatório Edições</strong> é o selo editorial do Núcleo de Pesquisa e Extensão OPAJE da Universidade Federal do Tocantins (UFT), dedicado à publicação, difusão e preservação de livros autorais, coletâneas e produções científicas de alto impacto.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/publicacoes"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-xl text-sm transition-all shadow-lg flex items-center gap-2"
                >
                  <BookOpen size={18} />
                  Explorar Publicações
                </Link>

                <Link
                  to="/submissoes"
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all border border-white/20 flex items-center gap-2 backdrop-blur-xs"
                >
                  <FileText size={18} />
                  Submeter Proposta
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* RECENT / FEATURED PUBLICATIONS CAROUSEL */}
        {/* ======================================================== */}
        {featuredBooks.length > 0 && (
          <section className="py-16 bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-1">
                    Destaques Editoriais
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-classical">
                    Obras em Destaque
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollCarousel('left')}
                    aria-label="Rolar carrossel para a esquerda"
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => scrollCarousel('right')}
                    aria-label="Rolar carrossel para a direita"
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <Link
                    to="/publicacoes"
                    className="ml-2 text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                  >
                    Ver todas <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Scrollable Carousel Track */}
              <div
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth"
              >
                {featuredBooks.map((book) => (
                  <div
                    key={book.id}
                    className="w-[280px] sm:w-[320px] shrink-0 snap-start"
                  >
                    <BookCard
                      book={book}
                      variant="featured"
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
                  </div>
                ))}
              </div>

            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* RECENT CATALOG GRID (LIVROS RECÉM-PUBLICADOS) */}
        {/* ======================================================== */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-1">
                  Últimos Lançamentos
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-classical">
                  Livros Recém-Publicados
                </h2>
              </div>
              <Link
                to="/publicacoes"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
              >
                Explorar Catálogo Completo <ArrowRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : books.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {books.slice(0, 4).map((book) => (
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
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <BookOpen size={40} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Nenhum livro publicado no momento.</p>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* EDITORIAL COLLECTIONS / SERIES */}
        {/* ======================================================== */}
        {collections.length > 0 && (
          <section className="py-16 bg-white border-y border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-1">
                  Linhas Editoriais
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-classical">
                  Coleções e Séries Temáticas
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 font-editorial">
                  Projetos editoriais estruturados para reunir pesquisas especializadas em eixos temáticos convergentes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {collections.map((col, idx) => (
                  <div
                    key={col.id || idx}
                    className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Layers size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-2 group-hover:text-blue-700 transition-colors">
                      {col.title}
                    </h3>
                    <p className="text-xs text-slate-600 font-editorial leading-relaxed line-clamp-3">
                      {col.description || 'Publicações acadêmicas dedicadas ao fortalecimento científico e institucional.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* OPEN CALLS FOR SUBMISSIONS (CHAMADAS ABERTAS) */}
        {/* ======================================================== */}
        <section id="chamadas" className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-1">
                  Oportunidades de Publicação
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-classical">
                  Chamadas Abertas
                </h2>
              </div>
              <Link
                to="/submissoes"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
              >
                Submeter Obra <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {calls.map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* EDITORIAL BOARD & TEAM */}
        {/* ======================================================== */}
        <section id="equipe" className="py-16 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-1">
                Corpo Editorial
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-classical">
                Equipe Editorial e Conselho Científico
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 font-editorial">
                Docentes, pesquisadores e profissionais dedicados à curadoria e à excelência acadêmica do Observatório Edições.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, idx) => (
                <div
                  key={member.id || idx}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-center space-y-2 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-14 h-14 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto shadow-xs">
                    {member.name.split(' ').slice(1, 2)[0]?.charAt(0) || member.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {member.name}
                  </h3>
                  <p className="text-xs text-blue-700 font-medium">
                    {member.role}
                  </p>
                  {member.institution && (
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {member.institution}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* CONTACT & EDITORIAL INQUIRY FORM */}
        {/* ======================================================== */}
        <section id="contato" className="py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm">
              <div className="text-center max-w-lg mx-auto mb-8">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-1">
                  Atendimento
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-classical">
                  Fale com a Editora
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-editorial">
                  Dúvidas sobre o processo editorial, propostas de publicações institucionais ou parcerias científicas.
                </p>
              </div>

              {formStatus === 'success' ? (
                <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-emerald-900">Mensagem Enviada com Sucesso!</h4>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    Agradecemos o seu contato. A equipe editorial do Observatório Edições responderá através do e-mail informado.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Seu Nome Completo <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex.: Prof. Dr. Silva"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail de Contato <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seuemail@universidade.edu.br"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assunto da Mensagem
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Dúvida sobre publicação e submissão">Dúvida sobre publicação e submissão</option>
                      <option value="Edital contínuo de livros e e-books">Edital contínuo de livros e e-books</option>
                      <option value="Parceria interinstitucional / Convênio">Parceria interinstitucional / Convênio</option>
                      <option value="Outros assuntos editoriais">Outros assuntos editoriais</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mensagem <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Descreva sua dúvida, proposta ou solicitação..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-editorial leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="submit"
                      disabled={formStatus === 'submitting'}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-7 py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                      <Send size={15} />
                      {formStatus === 'submitting' ? 'Enviando Mensagem...' : 'Enviar Mensagem para a Editora'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

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
