import React, { useState, useEffect } from 'react';
import {
  Book,
  BookContributor,
  ContributorRole,
  Author,
  EditorialCollection,
  getAuthors,
  getCollections,
  uploadFileWithProgress,
} from '../lib/store';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  ExternalLink,
  Search,
  Eye,
  Sparkles,
  FileText,
  Shield,
  Layers,
  Calendar,
  Loader2,
} from 'lucide-react';
import { isValidOrcid, isValidDoi, isValidIsbn, formatDoiUrl, formatOrcidUrl } from '../utils/validators';
import { fetchZenodoRecord } from '../utils/zenodo';
import { extractCoverFromPdf } from '../utils/pdfToCover';
import { BookCard } from './BookCard';
import { CitationBox } from './CitationBox';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookData: Omit<Book, 'id'>, id?: string) => Promise<void>;
  initialBook?: Book | null;
}

const PUBLICATION_TYPES = [
  'Livro autoral',
  'Coletânea',
  'E-book',
  'Relatório de Pesquisa',
  'Dossiê Temático',
];

const KNOWLEDGE_AREAS = [
  'Ciências Humanas',
  'Linguística, Letras e Artes',
  'Ciências Exatas e da Terra',
  'Ciências Biológicas',
  'Engenharias',
  'Ciências da Saúde',
  'Multidisciplinar',
];

const LICENSES = [
  'Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)',
  'Creative Commons Atribuição-NãoComercial 4.0 Internacional (CC BY-NC 4.0)',
  'Creative Commons Atribuição-NãoComercial-SemDerivações 4.0 (CC BY-NC-ND 4.0)',
  'Domínio Público (CC0 1.0)',
  'Direitos Autorais Reservados com Acesso Aberto Autorizado',
];

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBook,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Available author directory and collections
  const [authorsDirectory, setAuthorsDirectory] = useState<Author[]>([]);
  const [collectionsList, setCollectionsList] = useState<EditorialCollection[]>([]);

  // Step 1: Identification
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState('Livro autoral');
  const [edition, setEdition] = useState('1ª edição');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [publicationDate, setPublicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [volume, setVolume] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [category, setCategory] = useState('Ciências Sociais Aplicadas');
  const [language, setLanguage] = useState('Português');
  const [publisher, setPublisher] = useState('Observatório Edições / OPAJE-UFT');
  const [publicationCity, setPublicationCity] = useState('Palmas - TO, Brasil');

  // Step 2: Authorship
  const [contributors, setContributors] = useState<BookContributor[]>([
    { name: '', role: 'Autor', orcid: '', institution: 'Universidade Federal do Tocantins (UFT)', country: 'Brasil' },
  ]);

  // Step 3: Identifiers and info
  const [isbn, setIsbn] = useState('');
  const [isbnDigital, setIsbnDigital] = useState('');
  const [doi, setDoi] = useState('');
  const [zenodoUrl, setZenodoUrl] = useState('');
  const [pages, setPages] = useState<string | number>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [abstractText, setAbstractText] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [license, setLicense] = useState('Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)');
  const [isValidatingZenodo, setIsValidatingZenodo] = useState(false);
  const [zenodoFeedback, setZenodoFeedback] = useState('');

  // Step 4: Files
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);

  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [isExtractingCover, setIsExtractingCover] = useState(false);
  const [coverExtractedFromPdf, setCoverExtractedFromPdf] = useState(false);

  // Automatically extracts the 1st page of the PDF as the book cover
  const handlePdfFileSelect = async (file: File) => {
    setPdfFile(file);
    setPdfUploadProgress(0);

    setIsExtractingCover(true);
    try {
      const extractedCover = await extractCoverFromPdf(file);
      setCoverUrl(extractedCover);
      setCoverFile(null); // uses the extracted Data URL directly
      setCoverExtractedFromPdf(true);
    } catch (err) {
      console.warn('Could not automatically extract cover from PDF:', err);
    } finally {
      setIsExtractingCover(false);
    }
  };

  // Step 5: Publication Status
  const [status, setStatus] = useState<'Rascunho' | 'Agendado' | 'Publicado'>('Rascunho');
  const [isFeatured, setIsFeatured] = useState(false);

  // Load existing data if editing
  useEffect(() => {
    if (initialBook) {
      setTitle(initialBook.title || '');
      setSubtitle(initialBook.subtitle || '');
      setType(initialBook.type || 'Livro autoral');
      setEdition(initialBook.edition || '1ª edição');
      setYear(initialBook.year || new Date().getFullYear());
      setPublicationDate(initialBook.publicationDate || new Date().toISOString().split('T')[0]);
      setVolume(initialBook.volume || '');
      setCollectionName(initialBook.collection || '');
      setCategory(initialBook.category || 'Ciências Sociais Aplicadas');
      setLanguage(initialBook.language || 'Português');
      setPublisher(initialBook.publisher || 'Observatório Edições / OPAJE-UFT');
      setPublicationCity(initialBook.publicationCity || 'Palmas - TO, Brasil');
      
      if (initialBook.contributors && initialBook.contributors.length > 0) {
        setContributors(initialBook.contributors);
      } else {
        const legacyNames = initialBook.authors || initialBook.organizers || '';
        const parsed = legacyNames.split(';').map(n => ({
          name: n.trim(),
          role: (initialBook.organizers ? 'Organizador' : 'Autor') as ContributorRole,
          orcid: '',
          institution: 'UFT',
          country: 'Brasil'
        })).filter(c => c.name);
        setContributors(parsed.length > 0 ? parsed : [{ name: '', role: 'Autor', orcid: '', institution: '', country: 'Brasil' }]);
      }

      setIsbn(initialBook.isbn || '');
      setIsbnDigital(initialBook.isbnDigital || '');
      setDoi(initialBook.doi || '');
      setZenodoUrl(initialBook.zenodoUrl || '');
      setPages(initialBook.pages || '');
      setKeywords(initialBook.keywords || []);
      setAbstractText(initialBook.abstract || '');
      setSynopsis(initialBook.synopsis || '');
      setLicense(initialBook.license || 'Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)');
      setCoverUrl(initialBook.coverUrl || '');
      setPdfUrl(initialBook.pdfUrl || initialBook.downloadLink || '');
      setStatus(initialBook.status || 'Rascunho');
      setIsFeatured(Boolean(initialBook.isFeatured));
    } else {
      resetForm();
    }
    setCurrentStep(1);
    setErrorMessage('');
  }, [initialBook, isOpen]);

  // Load authors and collections for quick selection
  useEffect(() => {
    if (isOpen) {
      getAuthors().then(setAuthorsDirectory).catch(console.warn);
      getCollections().then(setCollectionsList).catch(console.warn);
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setType('Livro autoral');
    setEdition('1ª edição');
    setYear(new Date().getFullYear());
    setPublicationDate(new Date().toISOString().split('T')[0]);
    setVolume('');
    setCollectionName('');
    setCategory('Ciências Sociais Aplicadas');
    setLanguage('Português');
    setPublisher('Observatório Edições');
    setPublicationCity('Palmas - TO, Brasil');
    setContributors([{ name: '', role: 'Autor', orcid: '', institution: 'Universidade Federal do Tocantins (UFT)', country: 'Brasil' }]);
    setIsbn('');
    setIsbnDigital('');
    setDoi('');
    setZenodoUrl('');
    setPages('');
    setKeywords([]);
    setAbstractText('');
    setSynopsis('');
    setLicense('Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)');
    setCoverUrl('');
    setCoverFile(null);
    setPdfUrl('');
    setPdfFile(null);
    setStatus('Rascunho');
    setIsFeatured(false);
  };

  if (!isOpen) return null;

  // Add/remove contributor
  const handleAddContributor = () => {
    setContributors([
      ...contributors,
      { name: '', role: 'Autor', orcid: '', institution: '', country: 'Brasil' },
    ]);
  };

  const handleUpdateContributor = (index: number, field: keyof BookContributor, value: string) => {
    const updated = [...contributors];
    updated[index] = { ...updated[index], [field]: value };
    setContributors(updated);
  };

  const handleRemoveContributor = (index: number) => {
    if (contributors.length <= 1) return;
    setContributors(contributors.filter((_, i) => i !== index));
  };

  const handleSelectPredefinedAuthor = (index: number, author: Author) => {
    const updated = [...contributors];
    updated[index] = {
      name: author.name,
      role: author.defaultRole || 'Autor',
      orcid: author.orcid || '',
      institution: author.institution || '',
      country: author.country || 'Brasil',
    };
    setContributors(updated);
  };

  // Keywords management
  const handleAddKeyword = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    const clean = newKeywordInput.trim();
    if (clean && !keywords.includes(clean)) {
      setKeywords([...keywords, clean]);
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (tagToRemove: string) => {
    setKeywords(keywords.filter(t => t !== tagToRemove));
  };

  // Zenodo metadata validation
  const handleValidateZenodo = async () => {
    if (!zenodoUrl) {
      setZenodoFeedback('Insira a URL ou ID do registro no Zenodo.');
      return;
    }
    setIsValidatingZenodo(true);
    setZenodoFeedback('');
    try {
      const data = await fetchZenodoRecord(zenodoUrl);
      if (data) {
        setZenodoFeedback(`Registro verificado com sucesso no Zenodo! DOI: ${data.doi || 'N/A'}`);
        if (!title && data.title) setTitle(data.title);
        if (!doi && data.doi) setDoi(data.doi);
        if (!abstractText && data.description) setAbstractText(data.description);
      } else {
        setZenodoFeedback('Não foi possível recuperar os dados do registro no Zenodo. Verifique o identificador.');
      }
    } catch {
      setZenodoFeedback('Erro de conexão ao consultar a API do Zenodo.');
    } finally {
      setIsValidatingZenodo(false);
    }
  };

  // Step validation
  const validateStep = (stepNumber: number): boolean => {
    setErrorMessage('');
    if (stepNumber === 1) {
      if (!title.trim()) {
        setErrorMessage('O título da obra é obrigatório.');
        return false;
      }
      if (!year || year < 1900 || year > 2100) {
        setErrorMessage('Informe um ano de publicação válido.');
        return false;
      }
    }
    if (stepNumber === 2) {
      const validContributors = contributors.filter(c => c.name.trim() !== '');
      if (validContributors.length === 0) {
        setErrorMessage('Informe ao menos um autor ou organizador.');
        return false;
      }
      // Check ORCID formats if provided
      for (const c of validContributors) {
        if (c.orcid && !isValidOrcid(c.orcid)) {
          setErrorMessage(`O ORCID de "${c.name}" está em formato inválido. Use 0000-0000-0000-0000 ou link.`);
          return false;
        }
      }
    }
    if (stepNumber === 3) {
      if (doi && !isValidDoi(doi)) {
        setErrorMessage('O formato do DOI informado não é válido. Exemplo válido: 10.5281/zenodo.1234567');
        return false;
      }
      if (isbn && !isValidIsbn(isbn)) {
        setErrorMessage('O formato do ISBN impresso informado não é válido (deve ter 10 ou 13 dígitos).');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Save Book
  const handleFinalSubmit = async (targetStatus?: 'Rascunho' | 'Publicado' | 'Agendado') => {
    const finalStatus = targetStatus || status;

    if (finalStatus === 'Publicado') {
      // Must validate all previous steps
      if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let finalCoverUrl = coverUrl;
      let finalPdfUrl = pdfUrl;

      // Helper to convert cover image to Base64 Data URL if Cloud Storage is offline
      const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      // 1. If manual cover file was picked, convert to data URL if not already done
      if (coverFile) {
        try {
          finalCoverUrl = await fileToDataUrl(coverFile);
        } catch (dataUrlErr) {
          console.warn('Could not convert cover to data URL:', dataUrlErr);
        }
      }

      // 2. If PDF file was selected:
      let driveFileId = '';
      let driveWebViewLink = '';
      if (pdfFile) {
        // Try uploading to Google Drive folder "Observatório Edições - Livros (PDFs)" first
        try {
          const { getDriveAccessToken, uploadBookPdfToDrive } = await import('../lib/drive');
          const driveToken = await getDriveAccessToken(false);
          if (driveToken) {
            setPdfUploadProgress(40);
            const driveRes = await uploadBookPdfToDrive(pdfFile, title.trim() || 'Livro', driveToken);
            setPdfUploadProgress(100);
            driveFileId = driveRes.fileId;
            driveWebViewLink = driveRes.webViewLink;
            finalPdfUrl = driveRes.webViewLink || driveRes.webContentLink || finalPdfUrl;
          }
        } catch (driveErr) {
          console.warn('Google Drive PDF upload failed, trying cloud storage fallback:', driveErr);
        }

        // Fallback to Cloud Storage if not uploaded to Drive
        if (!finalPdfUrl) {
          try {
            finalPdfUrl = await uploadFileWithProgress(pdfFile, 'books_pdf', setPdfUploadProgress);
          } catch (uploadErr) {
            console.warn('Storage upload unavailable for PDF, proceeding with metadata and cover:', uploadErr);
            if (!finalPdfUrl && zenodoUrl) {
              finalPdfUrl = zenodoUrl;
            }
          }
        }
      }

      // Format legacy author and organizer strings for compatibility
      const authorsNames = contributors
        .filter(c => c.role === 'Autor' || !c.role)
        .map(c => c.name.trim())
        .join('; ');

      const organizersNames = contributors
        .filter(c => c.role === 'Organizador' || c.role === 'Coordenador')
        .map(c => c.name.trim())
        .join('; ');

      const bookPayload: Omit<Book, 'id'> = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        type,
        edition: edition.trim(),
        year: Number(year),
        publicationDate,
        volume: volume.trim(),
        collection: collectionName.trim(),
        category,
        language,
        publisher: publisher.trim(),
        publicationCity: publicationCity.trim(),
        authors: authorsNames || (contributors[0]?.name ? contributors[0].name : ''),
        organizers: organizersNames,
        contributors: contributors.filter(c => c.name.trim() !== ''),
        isbn: isbn.trim(),
        isbnDigital: isbnDigital.trim(),
        doi: doi.trim(),
        doiUrl: doi.trim() ? formatDoiUrl(doi) : '',
        zenodoUrl: zenodoUrl.trim(),
        pages: pages || '',
        keywords,
        abstract: abstractText.trim(),
        synopsis: synopsis.trim(),
        license,
        coverUrl: finalCoverUrl,
        pdfUrl: finalPdfUrl,
        downloadLink: finalPdfUrl,
        ...(driveFileId ? { driveFileId } : {}),
        ...(driveWebViewLink ? { driveWebViewLink } : {}),
        status: finalStatus,
        isFeatured,
      };

      await onSave(bookPayload, initialBook?.id);
      onClose();
    } catch (err: any) {
      console.error('Error saving book:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao salvar o livro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview Book object for Step 5
  const previewBook: Book = {
    id: initialBook?.id || 'preview_id',
    title: title || 'Título da Publicação',
    subtitle,
    type,
    edition,
    year,
    publicationDate,
    volume,
    collection: collectionName,
    category,
    language,
    publisher,
    publicationCity,
    authors: contributors.filter(c => c.role === 'Autor').map(c => c.name).join('; ') || 'Autor da Obra',
    organizers: contributors.filter(c => c.role === 'Organizador').map(c => c.name).join('; '),
    contributors,
    isbn,
    isbnDigital,
    doi,
    zenodoUrl,
    pages,
    keywords,
    abstract: abstractText,
    synopsis,
    license,
    coverUrl: coverUrl || (coverFile ? URL.createObjectURL(coverFile) : ''),
    pdfUrl,
    status,
    isFeatured,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 id="book-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-blue-400" />
              {initialBook ? 'Editar Obra Editorial' : 'Cadastrar Nova Obra'}
            </h2>
            <p className="text-xs text-slate-400">
              {initialBook ? `Atualizando dados de: ${initialBook.title}` : 'Preencha os metadados bibliográficos em 5 etapas'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 shrink-0">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Identificação' },
              { num: 2, label: 'Autoria' },
              { num: 3, label: 'Bibliográfico' },
              { num: 4, label: 'Arquivos' },
              { num: 5, label: 'Publicação' },
            ].map(step => (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  if (step.num < currentStep || validateStep(currentStep)) {
                    setCurrentStep(step.num);
                  }
                }}
                className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                  currentStep === step.num
                    ? 'text-blue-700'
                    : currentStep > step.num
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === step.num
                      ? 'bg-blue-700 text-white shadow-xs'
                      : currentStep > step.num
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  {currentStep > step.num ? <Check size={13} /> : step.num}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ======================================================== */}
          {/* STEP 1: IDENTIFICATION */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Etapa 1 — Identificação da Obra</h3>
                <p className="text-xs text-slate-500">Metadados principais e classificação da publicação.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Título da Obra <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Jornalismo Regional e Inovação na Amazônia Legal"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/40 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subtítulo (opcional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex.: Práticas Midiáticas, Diversidade e Tecnologias Aplicadas"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/40 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tipo de Publicação
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
                  >
                    {PUBLICATION_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Coleção Editorial
                  </label>
                  <input
                    type="text"
                    list="collections-datalist"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="Ex.: Comunicação e Sociedade"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                  <datalist id="collections-datalist">
                    {collectionsList.map(c => (
                      <option key={c.id} value={c.title} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ano de Publicação <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={1950}
                    max={2050}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Data Completa
                  </label>
                  <input
                    type="date"
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Edição
                  </label>
                  <input
                    type="text"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="Ex.: 1ª edição"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Volume
                  </label>
                  <input
                    type="text"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="Ex.: Vol. 1"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Idioma
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
                  >
                    <option value="Português">Português</option>
                    <option value="Inglês">Inglês</option>
                    <option value="Espanhol">Espanhol</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Editora
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Cidade de Publicação
                  </label>
                  <input
                    type="text"
                    value={publicationCity}
                    onChange={(e) => setPublicationCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: AUTHORSHIP */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Etapa 2 — Autoria e Participantes</h3>
                  <p className="text-xs text-slate-500">Adicione autores, organizadores, ORCID e instituições de vínculo.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddContributor}
                  className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  <Plus size={14} />
                  Adicionar Participante
                </button>
              </div>

              {/* Authors List */}
              <div className="space-y-4">
                {contributors.map((contrib, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Participante #{idx + 1}
                      </span>
                      {contributors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveContributor(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remover participante"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nome Completo <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={contrib.name}
                          onChange={(e) => handleUpdateContributor(idx, 'name', e.target.value)}
                          placeholder="Ex.: Prof. Dr. Leonardo Pinheiro"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                        />
                        {/* Quick pick from registered authors */}
                        {authorsDirectory.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1 overflow-x-auto py-1">
                            <span className="text-[10px] text-slate-400 shrink-0">Cadastrados:</span>
                            {authorsDirectory.slice(0, 4).map(auth => (
                              <button
                                key={auth.id}
                                type="button"
                                onClick={() => handleSelectPredefinedAuthor(idx, auth)}
                                className="text-[10px] bg-slate-200 hover:bg-blue-100 text-slate-700 px-2 py-0.5 rounded shrink-0 transition-colors"
                              >
                                {auth.name.split(' ')[0]} {auth.name.split(' ').slice(-1)[0]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Papel Editorial
                        </label>
                        <select
                          value={contrib.role}
                          onChange={(e) => handleUpdateContributor(idx, 'role', e.target.value as ContributorRole)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                        >
                          <option value="Autor">Autor</option>
                          <option value="Organizador">Organizador</option>
                          <option value="Coordenador">Coordenador</option>
                          <option value="Editor">Editor</option>
                          <option value="Tradutor">Tradutor</option>
                          <option value="Prefaciador">Prefaciador</option>
                          <option value="Ilustrador">Ilustrador</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          ORCID iD
                        </label>
                        <input
                          type="text"
                          value={contrib.orcid || ''}
                          onChange={(e) => handleUpdateContributor(idx, 'orcid', e.target.value)}
                          placeholder="0000-0002-1825-0097"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Instituição de Vínculo
                        </label>
                        <input
                          type="text"
                          value={contrib.institution || ''}
                          onChange={(e) => handleUpdateContributor(idx, 'institution', e.target.value)}
                          placeholder="Ex.: UFT"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          País
                        </label>
                        <input
                          type="text"
                          value={contrib.country || 'Brasil'}
                          onChange={(e) => handleUpdateContributor(idx, 'country', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: IDENTIFIERS & BIBLIOGRAPHIC */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Etapa 3 — Identificadores e Informações Bibliográficas</h3>
                <p className="text-xs text-slate-500">ISBN, DOI, registro Zenodo, resumo e licença de uso.</p>
              </div>

              {/* Identifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ISBN Impresso
                  </label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-65-00-00000-0"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ISBN Digital (E-book)
                  </label>
                  <input
                    type="text"
                    value={isbnDigital}
                    onChange={(e) => setIsbnDigital(e.target.value)}
                    placeholder="978-65-00-00001-7"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              {/* DOI and Zenodo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    DOI (Digital Object Identifier)
                  </label>
                  <input
                    type="text"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    placeholder="10.5281/zenodo.1234567"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Link do Registro no Zenodo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={zenodoUrl}
                      onChange={(e) => setZenodoUrl(e.target.value)}
                      placeholder="https://zenodo.org/records/10892345"
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleValidateZenodo}
                      disabled={isValidatingZenodo}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1"
                    >
                      {isValidatingZenodo ? 'Validando...' : 'Consultar'}
                    </button>
                  </div>
                  {zenodoFeedback && (
                    <p className="text-[11px] text-blue-700 mt-1">{zenodoFeedback}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Número de Páginas
                  </label>
                  <input
                    type="number"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    placeholder="Ex.: 284"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Licença de Utilização
                  </label>
                  <select
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
                  >
                    {LICENSES.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Keywords Tag Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Palavras-chave (Pressione Enter ou clique em Adicionar)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={handleAddKeyword}
                    placeholder="Adicionar termo..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddKeyword()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {keywords.map(kw => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-medium"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Abstract */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Resumo Acadêmico da Obra
                </label>
                <textarea
                  rows={4}
                  value={abstractText}
                  onChange={(e) => setAbstractText(e.target.value)}
                  placeholder="Texto do resumo com contextualização, objetivos, metodologia e conclusões..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-editorial leading-relaxed"
                />
              </div>

              {/* Synopsis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sinopse / Apresentação (para a orelha/contracapa)
                </label>
                <textarea
                  rows={2}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Breve texto promocional ou de apresentação para os leitores..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-editorial leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: FILES */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Etapa 4 — Arquivos e Capa</h3>
                <p className="text-xs text-slate-500">Envie a capa em alta resolução e o arquivo completo do livro em PDF.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cover Section */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Upload size={16} className="text-blue-600" />
                      Capa da Obra
                    </h4>
                    {coverExtractedFromPdf && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                        <Sparkles size={11} className="text-emerald-600" />
                        1ª pág. do PDF
                      </span>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="aspect-[1/1.4] bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden p-2 relative shadow-2xs">
                    {isExtractingCover ? (
                      <div className="text-center p-6 space-y-2">
                        <Loader2 size={32} className="mx-auto text-blue-600 animate-spin" />
                        <p className="text-xs font-bold text-slate-800">Processando PDF...</p>
                        <p className="text-[11px] text-slate-500">Extraindo a primeira página como capa da publicação.</p>
                      </div>
                    ) : coverFile ? (
                      <img
                        src={URL.createObjectURL(coverFile)}
                        alt="Preview da Capa"
                        className="max-h-full max-w-full object-contain rounded shadow-xs"
                      />
                    ) : coverUrl ? (
                      <img
                        src={coverUrl}
                        alt="Preview da Capa"
                        className="max-h-full max-w-full object-contain rounded shadow-xs"
                      />
                    ) : (
                      <div className="text-center text-slate-400 p-4">
                        <BookOpen size={48} className="mx-auto mb-2 text-slate-300" />
                        <span className="text-xs block">Nenhuma capa selecionada</span>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Envie o PDF ao lado para gerar a capa automaticamente.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* File Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Substituir por Arquivo de Capa (Opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setCoverFile(f);
                          setCoverExtractedFromPdf(false);
                        }
                      }}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {/* External URL alternative */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ou Link / URL Direto da Imagem da Capa
                    </label>
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => {
                        setCoverUrl(e.target.value);
                        setCoverExtractedFromPdf(false);
                      }}
                      placeholder="https://exemplo.com/capa.jpg"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                {/* PDF Document Section */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileText size={16} className="text-blue-600" />
                      Arquivo Completo em PDF
                    </h4>
                    <p className="text-[11px] text-blue-700 font-medium mt-0.5">
                      💡 Ao selecionar o PDF, a 1ª página será convertida na capa da obra automaticamente.
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                    <FileText size={40} className="mx-auto text-blue-700" />
                    {pdfFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800">{pdfFile.name}</p>
                        <p className="text-[11px] text-slate-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        {isExtractingCover && (
                          <p className="text-[11px] text-blue-700 font-bold flex items-center justify-center gap-1 mt-1">
                            <Loader2 size={12} className="animate-spin" /> Extraindo capa da 1ª página...
                          </p>
                        )}
                        {!isExtractingCover && coverExtractedFromPdf && (
                          <p className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1 mt-1">
                            <Check size={12} /> Capa gerada com sucesso!
                          </p>
                        )}
                      </div>
                    ) : pdfUrl ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                          <Check size={14} /> PDF configurado
                        </p>
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 hover:underline flex items-center justify-center gap-1 mt-1"
                        >
                          <ExternalLink size={12} /> Testar arquivo
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Nenhum arquivo PDF carregado</p>
                    )}
                  </div>

                  {/* File Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Selecionar Arquivo PDF da Obra
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePdfFileSelect(f);
                      }}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {/* External URL alternative */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ou Link Externo do PDF (Zenodo, Drive, Repositório)
                    </label>
                    <input
                      type="url"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      placeholder="https://exemplo.com/livro.pdf"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: PUBLICATION & PREVIEW */}
          {/* ======================================================== */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Etapa 5 — Situação Editorial e Pré-visualização</h3>
                  <p className="text-xs text-slate-500">Revise como a obra aparecerá no catálogo público antes de publicar.</p>
                </div>
              </div>

              {/* Status Radio Picker */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-3">
                  Selecione a Situação da Obra:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { val: 'Rascunho', desc: 'Salvo privadamente no painel. Não aparece no catálogo público.' },
                    { val: 'Agendado', desc: 'Pronto para lançamento, aguardando data de publicação.' },
                    { val: 'Publicado', desc: 'Disponível imediatamente para acesso e download no catálogo.' },
                  ].map(item => (
                    <label
                      key={item.val}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        status === item.val
                          ? 'bg-white border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          name="publication-status"
                          value={item.val}
                          checked={status === item.val}
                          onChange={() => setStatus(item.val as any)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-bold text-slate-900">{item.val}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pl-5">{item.desc}</p>
                    </label>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Destacar esta obra no carrossel da Página Inicial
                  </label>
                </div>
              </div>

              {/* Live Preview of the Book */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Eye size={14} className="text-blue-600" />
                  Pré-visualização do Cartão no Catálogo
                </div>

                <div className="max-w-xs mx-auto">
                  <BookCard book={previewBook} />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <CitationBox book={previewBook} />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <ChevronLeft size={16} />
                Etapa Anterior
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>

            {/* Quick Save as Draft button available anytime */}
            <button
              type="button"
              onClick={() => handleFinalSubmit('Rascunho')}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors"
            >
              Salvar como Rascunho
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-blue-700 text-white transition-colors shadow-xs"
              >
                Próxima Etapa
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinalSubmit()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white transition-colors shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Salvando Obra...</span>
                ) : (
                  <>
                    <Check size={16} />
                    {status === 'Publicado' ? 'Publicar Obra no Catálogo' : 'Salvar Alterações'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
