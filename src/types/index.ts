/**
 * Observatório Edições - Central Type Definitions
 */

export type BookStatus = 'Rascunho' | 'Agendado' | 'Publicado';

export type ContributorRole = 
  | 'Autor' 
  | 'Organizador' 
  | 'Coordenador' 
  | 'Editor' 
  | 'Tradutor'
  | 'Prefaciador'
  | 'Ilustrador';

export interface BookContributor {
  id?: string;
  name: string;
  role: ContributorRole;
  orcid?: string;
  institution?: string;
  institutionRor?: string;
  country?: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  edition?: string;
  publicationDate?: string;
  year: number;
  volume?: string;
  collection?: string;
  category?: string; // Knowledge Area
  language?: string;
  publisher?: string;
  publicationCity?: string;
  authors: string;
  organizers?: string;
  contributors?: BookContributor[];
  isbn?: string;
  isbnDigital?: string;
  doi?: string;
  doiUrl?: string;
  zenodoUrl?: string;
  pages?: number | string;
  keywords?: string[];
  abstract?: string;
  synopsis?: string;
  license?: string;
  coverUrl?: string;
  pdfUrl?: string;
  downloadLink?: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  statisticsUrl?: string;
  status: BookStatus;
  isFeatured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  chapterNumber: number | string;
  order: number;
  title: string;
  authors: string;
  abstract?: string;
  keywords?: string[];
  startPage?: number | string;
  endPage?: number | string;
  doi?: string;
  pdfUrl?: string;
  externalLink?: string;
  citationAbnt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Author {
  id: string;
  name: string;
  defaultRole: ContributorRole;
  orcid?: string;
  institution?: string;
  institutionRor?: string;
  country?: string;
  bio?: string;
  created_at?: string;
}

export interface EditorialCollection {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  order?: number;
  created_at?: string;
}

export type SubmissionStatus = 
  | 'Recebida' 
  | 'Em análise' 
  | 'Ajustes solicitados' 
  | 'Aprovada' 
  | 'Rejeitada';

export interface Submission {
  id: string;
  name: string; // Proponent name
  email: string;
  institution?: string;
  orcid?: string;
  title: string;
  workType?: string;
  thematicArea?: string;
  abstract: string;
  file?: File;
  fileUrl?: string;
  fileName?: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  agreementAccepted?: boolean;
  date: string;
  status: SubmissionStatus;
  notes?: string;
  created_at?: string;
}

export interface SubmissionTemplate {
  id: string;
  fileUrl: string;
  fileName: string;
  updatedAt: string;
  file?: File;
}

export interface Call {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'Aberta' | 'Fechada';
  link?: string;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  institution?: string;
  order: number;
  created_at?: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  content: string;
  date: string;
  status: 'Lida' | 'Não lida';
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'editor';
  displayName?: string;
  created_at?: string;
}
