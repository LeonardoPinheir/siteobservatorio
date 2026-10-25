import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Book,
  Chapter,
  Author,
  EditorialCollection,
  Submission,
  Call,
  TeamMember,
  Message,
  AdminUser,
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  updateBookStatusesBulk,
  getAllChapters,
  getChaptersByBookId,
  addChapter,
  updateChapter,
  deleteChapter,
  getAuthors,
  addAuthor,
  updateAuthor,
  deleteAuthor,
  getCollections,
  addCollection,
  updateCollection,
  deleteCollection,
  getSubmissions,
  updateSubmissionStatus,
  deleteSubmission,
  getCalls,
  addCall,
  updateCall,
  deleteCall,
  getTeam,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getMessages,
  updateMessageStatus,
  deleteMessage,
  getAdminUsers,
  setAdminUser,
  removeAdminUser,
  subscribeToAuth,
  logoutUser,
  initializeSeedData,
  BOOTSTRAP_ADMIN_EMAIL,
} from '../lib/store';
import { User as FirebaseUser } from 'firebase/auth';

// Component Modals
import { BookFormModal } from '../components/BookFormModal';
import { PublishSiteButton } from '../components/PublishSiteButton';
import { ChapterFormModal } from '../components/ChapterFormModal';
import { AuthorFormModal } from '../components/AuthorFormModal';
import { CallFormModal } from '../components/CallFormModal';
import { TeamFormModal } from '../components/TeamFormModal';
import { CollectionFormModal } from '../components/CollectionFormModal';
import { SubmissionDetailModal } from '../components/SubmissionDetailModal';
import { MessageDetailModal } from '../components/MessageDetailModal';

// Icons
import {
  LayoutDashboard,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Check,
  Eye,
  Filter,
  AlertTriangle,
  Upload,
  Mail,
  Calendar,
  User,
  Users,
  Layers,
  FileText,
  Megaphone,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  ShieldAlert,
  ArrowUpDown,
  CheckCircle2,
  ListOrdered,
  EyeOff,
  RefreshCw,
  Reply,
  CheckCheck,
  FolderCheck,
} from 'lucide-react';

type AdminTab =
  | 'overview'
  | 'books'
  | 'new_book'
  | 'chapters'
  | 'authors'
  | 'collections'
  | 'submissions'
  | 'calls'
  | 'team'
  | 'messages'
  | 'settings';

export function Admin() {
  const navigate = useNavigate();

  // Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'visitor'>('visitor');
  const [authChecking, setAuthChecking] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Core Data
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [collections, setCollections] = useState<EditorialCollection[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedBookForEdit, setSelectedBookForEdit] = useState<Book | null>(null);

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [selectedChapterForEdit, setSelectedChapterForEdit] = useState<Chapter | null>(null);
  const [chapterFilterBookId, setChapterFilterBookId] = useState<string>('');

  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [selectedAuthorForEdit, setSelectedAuthorForEdit] = useState<Author | null>(null);

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCallForEdit, setSelectedCallForEdit] = useState<Call | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<TeamMember | null>(null);

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [selectedCollectionForEdit, setSelectedCollectionForEdit] = useState<EditorialCollection | null>(null);

  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedSubmissionForDetail, setSelectedSubmissionForDetail] = useState<Submission | null>(null);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedMessageForDetail, setSelectedMessageForDetail] = useState<Message | null>(null);

  // Delete Confirmation Modals
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'book' | 'chapter' | 'author' | 'call' | 'team' | 'collection' | 'submission' | 'message';
    id: string;
    title: string;
    hasChaptersWarning?: boolean;
  } | null>(null);

  // Filters and searches
  const [bookSearch, setBookSearch] = useState('');
  const [bookStatusFilter, setBookStatusFilter] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('');

  const [messageSearch, setMessageSearch] = useState('');
  const [messageStatusFilter, setMessageStatusFilter] = useState('');

  // New admin email form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'editor'>('editor');

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auth Protection
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user, role) => {
      setCurrentUser(user);
      setUserRole(role);
      setAuthChecking(false);

      if (!user || (role !== 'admin' && role !== 'editor')) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Load All Admin Data
  const loadAdminData = async () => {
    setIsLoadingData(true);
    try {
      const [
        booksData,
        chaptersData,
        authorsData,
        collectionsData,
        submissionsData,
        callsData,
        teamData,
        messagesData,
        adminsData,
      ] = await Promise.all([
        getBooks(false), // get all books, including drafts
        getAllChapters(),
        getAuthors(),
        getCollections(),
        getSubmissions(),
        getCalls(),
        getTeam(),
        getMessages(),
        getAdminUsers(),
      ]);

      setBooks(booksData);
      setChapters(chaptersData);
      setAuthors(authorsData);
      setCollections(collectionsData);
      setSubmissions(submissionsData);
      setCalls(callsData);
      setTeam(teamData);
      setMessages(messagesData);
      setAdminUsers(adminsData);
    } catch (err) {
      console.warn('Error loading admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authChecking && (userRole === 'admin' || userRole === 'editor')) {
      loadAdminData();
      document.title = 'Painel Administrativo | Observatório Edições';
    }

    const reloadData = () => loadAdminData();
    window.addEventListener('booksUpdated', reloadData);
    window.addEventListener('chaptersUpdated', reloadData);
    window.addEventListener('authorsUpdated', reloadData);
    window.addEventListener('collectionsUpdated', reloadData);
    window.addEventListener('submissionsUpdated', reloadData);
    window.addEventListener('callsUpdated', reloadData);
    window.addEventListener('teamUpdated', reloadData);
    window.addEventListener('messagesUpdated', reloadData);

    return () => {
      window.removeEventListener('booksUpdated', reloadData);
      window.removeEventListener('chaptersUpdated', reloadData);
      window.removeEventListener('authorsUpdated', reloadData);
      window.removeEventListener('collectionsUpdated', reloadData);
      window.removeEventListener('submissionsUpdated', reloadData);
      window.removeEventListener('callsUpdated', reloadData);
      window.removeEventListener('teamUpdated', reloadData);
      window.removeEventListener('messagesUpdated', reloadData);
    };
  }, [authChecking, userRole]);

  // Derived counts
  const publishedBooksCount = useMemo(() => books.filter(b => b.status === 'Publicado').length, [books]);
  const draftBooksCount = useMemo(() => books.filter(b => b.status === 'Rascunho').length, [books]);
  const scheduledBooksCount = useMemo(() => books.filter(b => b.status === 'Agendado').length, [books]);
  const pendingSubmissionsCount = useMemo(() => submissions.filter(s => s.status === 'Recebida' || s.status === 'Em análise').length, [submissions]);
  const unreadMessagesCount = useMemo(() => messages.filter(m => m.status === 'Não lida').length, [messages]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchSearch =
        !bookSearch ||
        b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
        (b.authors && b.authors.toLowerCase().includes(bookSearch.toLowerCase())) ||
        (b.organizers && b.organizers.toLowerCase().includes(bookSearch.toLowerCase()));
      const matchStatus = !bookStatusFilter || b.status === bookStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [books, bookSearch, bookStatusFilter]);

  // Filtered chapters
  const filteredChapters = useMemo(() => {
    if (!chapterFilterBookId) return chapters;
    return chapters.filter(c => c.bookId === chapterFilterBookId);
  }, [chapters, chapterFilterBookId]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const matchSearch =
        !submissionSearch ||
        s.name.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        s.title.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(submissionSearch.toLowerCase());
      const matchStatus = !submissionStatusFilter || s.status === submissionStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [submissions, submissionSearch, submissionStatusFilter]);

  // Filtered contact messages
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const q = messageSearch.toLowerCase();
      const matchSearch =
        !q ||
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.subject || '').toLowerCase().includes(q) ||
        (m.content || '').toLowerCase().includes(q);
      const matchStatus = !messageStatusFilter || m.status === messageStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [messages, messageSearch, messageStatusFilter]);

  // Actions: Messages
  const handleOpenMessageModal = async (msg: Message) => {
    setSelectedMessageForDetail(msg);
    setIsMessageModalOpen(true);
    if (msg.status === 'Não lida') {
      try {
        await updateMessageStatus(msg.id, 'Lida');
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'Lida' } : m));
        setSelectedMessageForDetail({ ...msg, status: 'Lida' });
      } catch (err) {
        console.error('Failed to auto-mark message as read:', err);
      }
    }
  };

  const handleToggleMessageStatus = async (msg: Message) => {
    const nextStatus = msg.status === 'Lida' ? 'Não lida' : 'Lida';
    try {
      await updateMessageStatus(msg.id, nextStatus);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: nextStatus } : m));
      if (selectedMessageForDetail && selectedMessageForDetail.id === msg.id) {
        setSelectedMessageForDetail({ ...selectedMessageForDetail, status: nextStatus });
      }
      showToast(`Mensagem marcada como "${nextStatus}".`);
    } catch (err: any) {
      showToast(err.message || 'Erro ao alterar situação da mensagem.', 'error');
    }
  };

  const handleMarkAllMessagesAsRead = async () => {
    const unread = messages.filter(m => m.status === 'Não lida');
    if (unread.length === 0) {
      showToast('Não há mensagens não lidas pendentes.');
      return;
    }
    try {
      await Promise.all(unread.map(m => updateMessageStatus(m.id, 'Lida')));
      setMessages(prev => prev.map(m => ({ ...m, status: 'Lida' })));
      showToast(`${unread.length} mensagens marcadas como lidas.`);
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar mensagens.', 'error');
    }
  };

  // Actions: Save book
  const handleSaveBook = async (bookData: Omit<Book, 'id'>, id?: string) => {
    if (id) {
      await updateBook(id, bookData);
      showToast('Obra editorial atualizada com sucesso!');
    } else {
      await addBook(bookData);
      showToast('Nova obra cadastrada com sucesso!');
    }
  };

  // Actions: Toggle quick publish/unpublish
  const handleTogglePublish = async (book: Book) => {
    const newStatus = book.status === 'Publicado' ? 'Rascunho' : 'Publicado';
    await updateBook(book.id, { status: newStatus });
    showToast(`Situação alterada para "${newStatus}".`);
  };

  // Actions: Bulk update status
  const handleBulkStatusChange = async (status: Book['status']) => {
    if (selectedBookIds.length === 0) return;
    await updateBookStatusesBulk(selectedBookIds, status);
    setSelectedBookIds([]);
    showToast(`Status de ${selectedBookIds.length} obras atualizado para "${status}".`);
  };

  // Actions: Delete handlers
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const target = itemToDelete;
    setItemToDelete(null);

    try {
      if (target.type === 'book') {
        setBooks(prev => prev.filter(b => b.id !== target.id));
        await deleteBook(target.id);
        showToast('Obra excluída permanentemente.');
      } else if (target.type === 'chapter') {
        setChapters(prev => prev.filter(c => c.id !== target.id));
        await deleteChapter(target.id);
        showToast('Capítulo excluído com sucesso.');
      } else if (target.type === 'author') {
        setAuthors(prev => prev.filter(a => a.id !== target.id));
        await deleteAuthor(target.id);
        showToast('Autor removido do cadastro.');
      } else if (target.type === 'call') {
        setCalls(prev => prev.filter(c => c.id !== target.id));
        await deleteCall(target.id);
        showToast('Chamada excluída.');
      } else if (target.type === 'team') {
        setTeam(prev => prev.filter(t => t.id !== target.id));
        await deleteTeamMember(target.id);
        showToast('Membro removido da equipe.');
      } else if (target.type === 'collection') {
        setCollections(prev => prev.filter(col => col.id !== target.id));
        await deleteCollection(target.id);
        showToast('Coleção excluída.');
      } else if (target.type === 'submission') {
        setSubmissions(prev => prev.filter(s => s.id !== target.id));
        await deleteSubmission(target.id);
        showToast('Submissão excluída.');
      } else if (target.type === 'message') {
        setMessages(prev => prev.filter(m => m.id !== target.id));
        await deleteMessage(target.id);
        showToast('Mensagem excluída.');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir item.', 'error');
      loadAdminData();
    }
  };

  // Actions: Add new admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    try {
      await setAdminUser(newAdminEmail.trim(), newAdminRole);
      setNewAdminEmail('');
      showToast(`Permissão concedida para ${newAdminEmail}.`);
    } catch (err: any) {
      showToast(err.message || 'Erro ao conceder permissão.', 'error');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-300">Autenticando sessão editorial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-800">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-700'
              : 'bg-rose-800 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* LATERAL SIDEBAR MENU (10 ITEMS FROM SPEC) */}
      {/* ======================================================== */}
      <aside className="w-64 bg-[#0a1b2d] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80">
        
        {/* Brand Header */}
        <Link to="/" className="p-5 border-b border-slate-800/80 flex items-center gap-3 hover:bg-white/5 transition-colors group">
          <img
            src="/logo_observatorio.png"
            alt="Observatório Edições"
            className="h-10 w-auto object-contain brightness-0 invert group-hover:scale-105 transition-transform"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="font-bold text-white text-sm tracking-tight group-hover:text-blue-400 transition-colors">Observatório Edições</h1>
            <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider block">
              Painel Administrativo
            </span>
          </div>
        </Link>

        {/* User Card */}
        <div className="px-5 py-3 border-b border-slate-800/60 bg-white/5 flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{currentUser?.displayName || currentUser?.email}</p>
            <span className="text-[10px] text-amber-400 font-semibold uppercase">
              {userRole === 'admin' ? 'Administrador' : 'Editor Autorizado'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sair do painel"
            className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* 10 Sidebar Menu Items */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto text-xs font-semibold">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
              activeTab === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard size={17} />
            <span>1. Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
              activeTab === 'books' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen size={17} />
              <span>2. Gerenciar Livros</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">
              {books.length}
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedBookForEdit(null);
              setIsBookModalOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 font-bold border border-blue-500/30 transition-colors"
          >
            <Plus size={17} />
            <span>3. Cadastrar Novo Livro</span>
          </button>

          <button
            onClick={() => setActiveTab('chapters')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
              activeTab === 'chapters' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ListOrdered size={17} />
              <span>4. Gerenciar Capítulos</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">
              {chapters.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('authors')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
              activeTab === 'authors' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <User size={17} />
              <span>5. Autores e Organizadores</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">
              {authors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('collections')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
              activeTab === 'collections' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers size={17} />
              <span>6. Coleções Editoriais</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">
              {collections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
              activeTab === 'submissions' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText size={17} />
              <span>7. Submissões de Obras</span>
            </div>
            {pendingSubmissionsCount > 0 ? (
              <span className="text-[10px] bg-amber-500 text-slate-900 font-bold px-1.5 py-0.5 rounded-full">
                {pendingSubmissionsCount}
              </span>
            ) : (
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">
                {submissions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
              activeTab === 'messages' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Mail size={17} />
              <span>8. Mensagens de Contato</span>
            </div>
            {unreadMessagesCount > 0 ? (
              <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-pulse">
                {unreadMessagesCount}
              </span>
            ) : (
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
              activeTab === 'calls' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Megaphone size={17} />
              <span>9. Chamadas Abertas</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">
              {calls.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
              activeTab === 'team' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users size={17} />
              <span>10. Equipe Editorial</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">
              {team.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
              activeTab === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Settings size={17} />
            <span>11. Configurações</span>
          </button>

        </nav>

        {/* Bottom Link to Portal */}
        <div className="p-3 border-t border-slate-800/80">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 rounded-xl transition-colors"
          >
            <ExternalLink size={14} />
            Ver Portal Público
          </Link>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN ADMIN WORKSPACE */}
      {/* ======================================================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 capitalize">
              {activeTab === 'overview' && 'Visão Geral do Portal Editorial'}
              {activeTab === 'books' && 'Gerenciamento de Livros e Obras'}
              {activeTab === 'chapters' && 'Gerenciamento de Capítulos'}
              {activeTab === 'authors' && 'Diretório de Autores e Organizadores'}
              {activeTab === 'collections' && 'Coleções e Linhas Editoriais'}
              {activeTab === 'submissions' && 'Propostas de Publicação (Submissões)'}
              {activeTab === 'messages' && 'Mensagens de Contato e Fale Conosco'}
              {activeTab === 'calls' && 'Chamadas Abertas e Editais'}
              {activeTab === 'team' && 'Composição da Equipe Editorial'}
              {activeTab === 'settings' && 'Configurações e Usuários Autorizados'}
            </h2>
            <p className="text-xs text-slate-500">
              Selo editorial acadêmico Observatório Edições • UFT / OPAJE
            </p>
          </div>

          <div className="flex items-center gap-3">
            <PublishSiteButton />
            <button
              onClick={() => {
                setSelectedBookForEdit(null);
                setIsBookModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus size={15} />
              Novo Livro
            </button>
          </div>
        </header>

        {/* Tab Contents */}
        <div className="p-8 flex-1">

          {/* ==================================================== */}
          {/* TAB 1: VISÃO GERAL (OVERVIEW) */}
          {/* ==================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in">
              
              {/* Stat Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Total de Livros</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <BookOpen size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">{books.length}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Obras registradas</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Publicados</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-700 mt-2 font-mono">{publishedBooksCount}</p>
                  <p className="text-[10px] text-slate-400 mt-1">No catálogo público</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Em Edição</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-amber-700 mt-2 font-mono">{draftBooksCount + scheduledBooksCount}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{draftBooksCount} rascunhos</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Submissões</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-purple-700 mt-2 font-mono">{pendingSubmissionsCount}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Pendentes de análise</p>
                </div>

                <div 
                  onClick={() => setActiveTab('messages')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Mensagens</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      unreadMessagesCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Mail size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">{messages.length}</p>
                  <p className={`text-[10px] mt-1 font-semibold ${
                    unreadMessagesCount > 0 ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {unreadMessagesCount > 0 ? `${unreadMessagesCount} não lida(s)` : 'Todas lidas'}
                  </p>
                </div>

              </div>

              {/* Quick Shortcuts & Recent Publications */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Recent Books List (8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">Últimas Publicações Cadastradas</h3>
                    <button
                      onClick={() => setActiveTab('books')}
                      className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      Ver todas <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {books.slice(0, 5).map(b => (
                      <div key={b.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-14 bg-slate-100 rounded border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {b.coverUrl ? (
                              <img src={b.coverUrl} alt="Capa" className="h-full w-full object-cover" />
                            ) : (
                              <BookOpen size={16} className="text-slate-400" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-slate-900 text-xs truncate">{b.title}</h4>
                            <p className="text-[11px] text-slate-500 truncate">{b.authors || b.organizers}</p>
                            <span className="text-[10px] text-slate-400">{b.year} • {b.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            b.status === 'Publicado'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}>
                            {b.status}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedBookForEdit(b);
                              setIsBookModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-700 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions Card (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-slate-100">Ações Rápidas de Gestão</h3>
                    <p className="text-xs text-slate-400 font-editorial leading-relaxed">
                      Atalhos para as operações mais frequentes da rotina editorial.
                    </p>
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedBookForEdit(null);
                          setIsBookModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                      >
                        <Plus size={16} />
                        Cadastrar Novo Livro
                      </button>

                      <button
                        onClick={() => {
                          setSelectedChapterForEdit(null);
                          setIsChapterModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                      >
                        <ListOrdered size={16} />
                        Vincular Capítulo a Livro
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAuthorForEdit(null);
                          setIsAuthorModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                      >
                        <User size={16} />
                        Cadastrar Autor / Pesquisador
                      </button>

                      <button
                        onClick={() => setActiveTab('submissions')}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                      >
                        <FileText size={16} />
                        Avaliar Submissões ({pendingSubmissionsCount})
                      </button>

                      <button
                        onClick={() => setActiveTab('messages')}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Mail size={16} />
                          <span>Mensagens Recebidas</span>
                        </div>
                        {unreadMessagesCount > 0 ? (
                          <span className="bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {unreadMessagesCount} nova{unreadMessagesCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">{messages.length}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Contact Inquiries Alert */}
                  {unreadMessagesCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Mail size={18} className="text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-amber-900">Mensagens de Contato</h4>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Você possui {unreadMessagesCount} mensagem(ns) pendente(s) de leitura.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('messages')}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors"
                      >
                        Ver
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: GERENCIAR LIVROS (BOOKS MANAGEMENT) */}
          {/* ==================================================== */}
          {activeTab === 'books' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Filter and Search Bar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full sm:w-auto">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="Filtrar por título, autor ou organizador..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                  <select
                    value={bookStatusFilter}
                    onChange={(e) => setBookStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
                  >
                    <option value="">Todas as Situações</option>
                    <option value="Publicado">Publicado</option>
                    <option value="Rascunho">Rascunho</option>
                    <option value="Agendado">Agendado</option>
                  </select>

                  <button
                    onClick={() => {
                      setSelectedBookForEdit(null);
                      setIsBookModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    <Plus size={15} />
                    Novo Livro
                  </button>
                </div>
              </div>

              {/* Bulk Actions Bar if items selected */}
              {selectedBookIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between text-xs text-blue-900">
                  <span className="font-bold">{selectedBookIds.length} obras selecionadas</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkStatusChange('Publicado')}
                      className="px-3 py-1 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800"
                    >
                      Publicar Selecionadas
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('Rascunho')}
                      className="px-3 py-1 bg-amber-700 text-white rounded-lg font-bold hover:bg-amber-800"
                    >
                      Tornar Rascunho
                    </button>
                  </div>
                </div>
              )}

              {/* Books Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedBookIds.length === filteredBooks.length && filteredBooks.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedBookIds(filteredBooks.map(b => b.id));
                            else setSelectedBookIds([]);
                          }}
                          className="rounded text-blue-600"
                        />
                      </th>
                      <th className="p-3">Obra / Título</th>
                      <th className="p-3">Autoria / Organizadores</th>
                      <th className="p-3">Ano</th>
                      <th className="p-3">Área / Coleção</th>
                      <th className="p-3">Situação</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBooks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedBookIds.includes(b.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedBookIds([...selectedBookIds, b.id]);
                              else setSelectedBookIds(selectedBookIds.filter(id => id !== b.id));
                            }}
                            className="rounded text-blue-600"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-12 bg-slate-100 rounded border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                              {b.coverUrl ? (
                                <img src={b.coverUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <BookOpen size={14} className="text-slate-400" />
                              )}
                            </div>
                            <div className="max-w-xs">
                              <h4 className="font-bold text-slate-900 leading-snug line-clamp-1">{b.title}</h4>
                              {b.subtitle && <p className="text-[11px] text-slate-400 line-clamp-1">{b.subtitle}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 max-w-[160px] truncate font-medium text-slate-700">
                          {b.authors || b.organizers || 'Não informado'}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{b.year}</td>
                        <td className="p-3 text-slate-500">
                          <div className="truncate max-w-[140px]">{b.category || '-'}</div>
                          {b.collection && <div className="text-[10px] text-slate-400 truncate">{b.collection}</div>}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === 'Publicado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'Agendado'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/book/${b.id}`}
                              target="_blank"
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded"
                              title="Visualizar Página Pública"
                            >
                              <Eye size={15} />
                            </Link>

                            <button
                              onClick={() => handleTogglePublish(b)}
                              className={`p-1.5 rounded transition-colors ${
                                b.status === 'Publicado'
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={b.status === 'Publicado' ? 'Despublicar (Tornar rascunho)' : 'Publicar no Catálogo'}
                            >
                              {b.status === 'Publicado' ? <EyeOff size={15} /> : <Check size={15} />}
                            </button>

                            <button
                              onClick={() => {
                                setSelectedBookForEdit(b);
                                setIsBookModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-700 rounded"
                              title="Editar Obra"
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              onClick={async () => {
                                const linked = await getChaptersByBookId(b.id);
                                setItemToDelete({
                                  type: 'book',
                                  id: b.id,
                                  title: b.title,
                                  hasChaptersWarning: linked.length > 0,
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                              title="Excluir Obra"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredBooks.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-500">
                          <BookOpen size={36} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-sm font-bold text-slate-700">Nenhuma obra cadastrada no catálogo</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            O sistema editorial está limpo e pronto para receber publicações reais.
                          </p>
                          <button
                            onClick={() => {
                              setSelectedBookForEdit(null);
                              setIsBookModalOpen(true);
                            }}
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            <Plus size={14} /> Cadastrar Primeira Obra
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: GERENCIAR CAPÍTULOS (CHAPTERS) */}
          {/* ==================================================== */}
          {activeTab === 'chapters' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-500 shrink-0">Filtrar por Livro:</span>
                  <select
                    value={chapterFilterBookId}
                    onChange={(e) => setChapterFilterBookId(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
                  >
                    <option value="">Todos os Livros</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setSelectedChapterForEdit(null);
                    setIsChapterModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <Plus size={15} />
                  Novo Capítulo
                </button>
              </div>

              {/* Chapters Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 w-16">Ordem</th>
                      <th className="p-3">Título do Capítulo</th>
                      <th className="p-3">Livro de Origem</th>
                      <th className="p-3">Autores</th>
                      <th className="p-3">Páginas</th>
                      <th className="p-3">PDF / DOI</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredChapters.map(c => {
                      const parentBook = books.find(b => b.id === c.bookId);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-mono font-bold text-blue-700">
                            Cap. {c.chapterNumber || c.order}
                          </td>
                          <td className="p-3 font-bold text-slate-900 max-w-xs">{c.title}</td>
                          <td className="p-3 text-slate-600 max-w-[180px] truncate">
                            {parentBook?.title || c.bookId}
                          </td>
                          <td className="p-3 text-slate-600">{c.authors}</td>
                          <td className="p-3 text-slate-500">
                            {c.startPage && c.endPage ? `${c.startPage}–${c.endPage}` : '-'}
                          </td>
                          <td className="p-3 text-slate-500">
                            {c.pdfUrl ? (
                              <span className="text-emerald-700 font-bold">Disponível</span>
                            ) : (
                              <span className="text-slate-400">Sem PDF</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setSelectedChapterForEdit(c);
                                  setIsChapterModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-700 rounded"
                                title="Editar Capítulo"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => setItemToDelete({ type: 'chapter', id: c.id, title: c.title })}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                                title="Excluir Capítulo"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: AUTORES E ORGANIZADORES */}
          {/* ==================================================== */}
          {activeTab === 'authors' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Diretório de Pesquisadores</h3>
                  <p className="text-xs text-slate-500">Cadastre autores para vinculá-los facilmente a publicações.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAuthorForEdit(null);
                    setIsAuthorModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <Plus size={15} />
                  Novo Autor
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {authors.map(a => (
                  <div key={a.id} className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{a.name}</h4>
                        <span className="text-[10px] bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded">
                          {a.defaultRole}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedAuthorForEdit(a);
                            setIsAuthorModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-700"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'author', id: a.id, title: a.name })}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {a.institution && <p className="text-xs text-slate-500">{a.institution}</p>}
                    {a.orcid && (
                      <p className="text-[11px] text-emerald-700 font-mono">
                        ORCID: {a.orcid}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 6: COLEÇÕES EDITORIAIS */}
          {/* ==================================================== */}
          {activeTab === 'collections' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Coleções e Séries Temáticas</h3>
                  <p className="text-xs text-slate-500">Gerencie as linhas editoriais do Observatório Edições.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCollectionForEdit(null);
                    setIsCollectionModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <Plus size={15} />
                  Nova Coleção
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map(col => (
                  <div key={col.id} className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{col.title}</h4>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedCollectionForEdit(col);
                            setIsCollectionModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-700"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'collection', id: col.id, title: col.title })}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 font-editorial line-clamp-3">{col.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 7: SUBMISSÕES (SUBMISSIONS) */}
          {/* ==================================================== */}
          {activeTab === 'submissions' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    placeholder="Filtrar por autor, título da proposta ou e-mail..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  />
                </div>
                <select
                  value={submissionStatusFilter}
                  onChange={(e) => setSubmissionStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
                >
                  <option value="">Todos os Status</option>
                  <option value="Recebida">Recebida</option>
                  <option value="Em análise">Em análise</option>
                  <option value="Ajustes solicitados">Ajustes solicitados</option>
                  <option value="Aprovada">Aprovada</option>
                  <option value="Rejeitada">Rejeitada</option>
                </select>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">Proponente</th>
                      <th className="p-3">Título da Obra</th>
                      <th className="p-3">Tipo / Área</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubmissions.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 text-slate-500 font-mono">
                          {new Date(s.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-[11px] text-slate-400">{s.email}</p>
                        </td>
                        <td className="p-3 font-semibold text-slate-800 max-w-xs truncate">{s.title}</td>
                        <td className="p-3 text-slate-500">{s.workType}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'Aprovada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'Rejeitada'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedSubmissionForDetail(s);
                                setIsSubmissionModalOpen(true);
                              }}
                              className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-xs"
                            >
                              Avaliar
                            </button>
                            <button
                              onClick={() => setItemToDelete({ type: 'submission', id: s.id, title: s.title })}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* ==================================================== */}
          {/* TAB 8: MENSAGENS DE CONTATO (MESSAGES) */}
          {/* ==================================================== */}
          {activeTab === 'messages' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header and stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Caixa de Entrada de Mensagens</h3>
                  <p className="text-xs text-slate-500">
                    Mensagens enviadas por leitores, autores e pesquisadores através do formulário de contato.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadAdminData}
                    title="Atualizar lista de mensagens"
                    className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded-xl shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw size={15} />
                  </button>
                  {unreadMessagesCount > 0 && (
                    <button
                      onClick={handleMarkAllMessagesAsRead}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs border border-blue-200/60 transition-colors shadow-2xs"
                    >
                      <CheckCheck size={15} />
                      Marcar todas como lidas ({unreadMessagesCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full sm:w-auto">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder="Filtrar por nome do remetente, e-mail, assunto ou conteúdo..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                  {messageSearch && (
                    <button
                      onClick={() => setMessageSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={messageStatusFilter}
                    onChange={(e) => setMessageStatusFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Todas as Mensagens ({messages.length})</option>
                    <option value="Não lida">Não Lidas ({unreadMessagesCount})</option>
                    <option value="Lida">Lidas ({messages.length - unreadMessagesCount})</option>
                  </select>
                </div>
              </div>

              {/* Messages Table & Cards */}
              {filteredMessages.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs space-y-3">
                  <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <Mail size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {messageSearch || messageStatusFilter
                      ? 'Nenhuma mensagem encontrada para estes filtros.'
                      : 'Nenhuma mensagem recebida ainda.'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto font-editorial">
                    {messageSearch || messageStatusFilter
                      ? 'Tente remover os termos de busca ou mudar o status selecionado.'
                      : 'As mensagens enviadas por visitantes e pesquisadores através do formulário de contato do portal aparecerão automaticamente aqui.'}
                  </p>
                  {(messageSearch || messageStatusFilter) && (
                    <button
                      onClick={() => {
                        setMessageSearch('');
                        setMessageStatusFilter('');
                      }}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5 w-24">Situação</th>
                          <th className="p-3.5 w-32">Data/Hora</th>
                          <th className="p-3.5">Remetente</th>
                          <th className="p-3.5">Assunto / Conteúdo</th>
                          <th className="p-3.5 text-right w-44">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredMessages.map((m) => {
                          const isUnread = m.status === 'Não lida';
                          return (
                            <tr
                              key={m.id}
                              className={`transition-colors ${
                                isUnread ? 'bg-amber-50/40 hover:bg-amber-50/70 font-medium' : 'hover:bg-slate-50/70'
                              }`}
                            >
                              <td className="p-3.5">
                                {isUnread ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px]">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    Não lida
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px]">
                                    <CheckCircle2 size={12} className="text-emerald-600" />
                                    Lida
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                                {(() => {
                                  try {
                                    const d = new Date(m.date);
                                    return (
                                      <>
                                        <span className="block font-semibold text-slate-700">
                                          {d.toLocaleDateString('pt-BR')}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </>
                                    );
                                  } catch {
                                    return m.date;
                                  }
                                })()}
                              </td>
                              <td className="p-3.5">
                                <p className={`text-slate-900 ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                                  {m.name || 'Nome não informado'}
                                </p>
                                <a
                                  href={`mailto:${m.email}`}
                                  className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <Mail size={11} className="text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[200px]">{m.email}</span>
                                </a>
                              </td>
                              <td className="p-3.5">
                                <p className={`text-slate-900 text-xs truncate max-w-md ${isUnread ? 'font-bold' : 'font-medium'}`}>
                                  {m.subject || 'Sem assunto'}
                                </p>
                                <p className="text-[11px] text-slate-500 font-editorial line-clamp-1 max-w-md mt-0.5">
                                  {m.content}
                                </p>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenMessageModal(m)}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1"
                                    title="Visualizar mensagem completa"
                                  >
                                    <Eye size={13} />
                                    <span>Ler</span>
                                  </button>

                                  <button
                                    onClick={() => handleToggleMessageStatus(m)}
                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                    title={isUnread ? 'Marcar como Lida' : 'Marcar como Não Lida'}
                                  >
                                    <CheckCircle2 size={15} className={isUnread ? 'text-slate-400' : 'text-emerald-600'} />
                                  </button>

                                  <a
                                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'Contato - Observatório Edições'}`)}`}
                                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Responder por e-mail"
                                  >
                                    <Reply size={15} />
                                  </a>

                                  <button
                                    onClick={() => setItemToDelete({ type: 'message', id: m.id, title: m.subject || m.name })}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Excluir mensagem"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 9: CHAMADAS ABERTAS (CALLS) */}
          {/* ==================================================== */}
          {activeTab === 'calls' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Editais e Chamadas para Publicação</h3>
                  <p className="text-xs text-slate-500">Publique chamadas para coletâneas ou submissões de fluxo contínuo.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCallForEdit(null);
                    setIsCallModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <Plus size={15} />
                  Nova Chamada
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calls.map(c => (
                  <div key={c.id} className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          c.status === 'Aberta' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.status}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{c.title}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedCallForEdit(c);
                            setIsCallModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-700"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'call', id: c.id, title: c.title })}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 font-editorial line-clamp-3">{c.description}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Prazo: {new Date(c.deadline).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 9: EQUIPE EDITORIAL (TEAM) */}
          {/* ==================================================== */}
          {activeTab === 'team' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Equipe Editorial e Conselho Científico</h3>
                  <p className="text-xs text-slate-500">Membros do conselho, revisores e equipe técnica.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTeamForEdit(null);
                    setIsTeamModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <Plus size={15} />
                  Adicionar Membro
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.map(m => (
                  <div key={m.id} className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                        <p className="text-xs text-blue-700 font-semibold">{m.role}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedTeamForEdit(m);
                            setIsTeamModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-700"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'team', id: m.id, title: m.name })}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {m.institution && <p className="text-[11px] text-slate-500">{m.institution}</p>}
                    <p className="text-[10px] text-slate-400">Ordem de exibição: {m.order}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 10: CONFIGURAÇÕES E USUÁRIOS AUTORIZADOS */}
          {/* ==================================================== */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in">
              
              {/* Admins & Editors Management */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Controle de Acesso e Usuários Autorizados</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Defina quais contas Google possuem privilégios de Administrador ou Editor.
                  </p>
                </div>

                <form onSubmit={handleAddAdmin} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="email.editor@universidade.edu.br"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
                  >
                    Autorizar
                  </button>
                </form>

                <div className="divide-y divide-slate-100 pt-2">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{BOOTSTRAP_ADMIN_EMAIL}</p>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold uppercase">
                        Coordenador Geral (Bootstrap)
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 italic">Inamovível</span>
                  </div>

                  {adminUsers.map(adm => (
                    <div key={adm.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{adm.email}</p>
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold uppercase">
                          {adm.role}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          await removeAdminUser(adm.id);
                          showToast('Autorização revogada.');
                        }}
                        className="text-xs text-rose-600 hover:underline font-medium"
                      >
                        Revogar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Google Drive Integration Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <FolderCheck size={18} className="text-emerald-600" />
                      Integração com Google Drive
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sincronização de arquivos nas pastas dedicadas do Google Drive.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Ativo via Google OAuth
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-800">Pasta 1: Submissões de Propostas</p>
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">Observatório Edições - Submissões</p>
                    <p className="text-[10px] text-slate-400 mt-1">Salva todos os PDFs e Docs enviados pelos autores</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-800">Pasta 2: Livros e Obras (PDFs)</p>
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">Observatório Edições - Livros (PDFs)</p>
                    <p className="text-[10px] text-slate-400 mt-1">Armazena os PDFs integrais das publicações do catálogo</p>
                  </div>
                </div>
              </div>

              {/* Security and Policies Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
                <h3 className="font-bold text-slate-900 text-base">Políticas e Segurança de Dados</h3>
                <p className="text-xs text-slate-600 font-editorial leading-relaxed">
                  As regras do Firestore garantem que apenas publicações com status <strong>Publicado</strong> são acessíveis publicamente. Rascunhos, submissões e mensagens são restritos exclusivamente a administradores autenticados.
                </p>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* 5-Step Book Creation & Editing Wizard */}
      <BookFormModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSave={handleSaveBook}
        initialBook={selectedBookForEdit}
      />

      {/* Chapter Modal */}
      <ChapterFormModal
        isOpen={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        onSave={async (chapterData, id) => {
          if (id) {
            await updateChapter(id, chapterData);
            showToast('Capítulo atualizado com sucesso!');
          } else {
            await addChapter(chapterData);
            showToast('Capítulo vinculado com sucesso!');
          }
        }}
        books={books}
        initialChapter={selectedChapterForEdit}
        defaultBookId={chapterFilterBookId}
      />

      {/* Author Modal */}
      <AuthorFormModal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        onSave={async (authorData, id) => {
          if (id) {
            await updateAuthor(id, authorData);
            showToast('Autor atualizado.');
          } else {
            await addAuthor(authorData);
            showToast('Autor cadastrado.');
          }
        }}
        initialAuthor={selectedAuthorForEdit}
      />

      {/* Call Modal */}
      <CallFormModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        onSave={async (callData, id) => {
          if (id) {
            await updateCall(id, callData);
            showToast('Chamada atualizada.');
          } else {
            await addCall(callData);
            showToast('Chamada publicada.');
          }
        }}
        initialCall={selectedCallForEdit}
      />

      {/* Team Modal */}
      <TeamFormModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onSave={async (memberData, id) => {
          if (id) {
            await updateTeamMember(id, memberData);
            showToast('Membro atualizado.');
          } else {
            await addTeamMember(memberData);
            showToast('Membro adicionado à equipe.');
          }
        }}
        initialMember={selectedTeamForEdit}
      />

      {/* Collection Modal */}
      <CollectionFormModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        onSave={async (colData, id) => {
          if (id) {
            await updateCollection(id, colData);
            showToast('Coleção atualizada.');
          } else {
            await addCollection(colData);
            showToast('Coleção criada com sucesso.');
          }
        }}
        initialCollection={selectedCollectionForEdit}
      />

      {/* Submission Review Modal */}
      <SubmissionDetailModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        submission={selectedSubmissionForDetail}
        onUpdateStatus={async (id, status, notes) => {
          await updateSubmissionStatus(id, status, notes);
          showToast(`Parecer editorial registrado: "${status}".`);
        }}
      />

      {/* Message Detail Modal */}
      <MessageDetailModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        message={selectedMessageForDetail}
        onToggleStatus={handleToggleMessageStatus}
        onDelete={(id, title) => {
          setItemToDelete({ type: 'message', id, title });
        }}
      />

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Confirmar Exclusão</h3>
              <p className="text-xs text-slate-500">
                Tem certeza de que deseja excluir permanentemente:
              </p>
              <p className="text-sm font-semibold text-slate-800 font-editorial">
                "{itemToDelete.title}"?
              </p>
            </div>

            {itemToDelete.hasChaptersWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-bold block">Atenção Especial:</span>
                Esta obra possui capítulos vinculados. A exclusão apagará também todos os capítulos associados a este livro.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Confirmar e Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
