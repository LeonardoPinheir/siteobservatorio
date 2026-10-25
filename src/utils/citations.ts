/**
 * Observatório Edições - Academic Citation Generator
 * Compliant with ABNT NBR 6023:2018 and APA 7th Edition
 */

export interface CitationBookMetadata {
  title: string;
  subtitle?: string;
  authors?: string;
  organizers?: string;
  year?: number | string;
  edition?: string;
  publisher?: string;
  city?: string;
  pages?: number | string;
  isbn?: string;
  doi?: string;
  url?: string;
}

export interface CitationChapterMetadata {
  chapterTitle: string;
  chapterAuthors: string;
  startPage?: number | string;
  endPage?: number | string;
  chapterDoi?: string;
  book: CitationBookMetadata;
}

/**
 * Splits author names string (e.g. "Leonardo Pinheiro, Maria Silva" or "Leonardo Pinheiro; Maria Silva")
 */
function parseAuthorNames(namesStr?: string): string[] {
  if (!namesStr) return [];
  // Split on either semicolon or comma (if no semicolon exists)
  const delimiter = namesStr.includes(';') ? ';' : ',';
  return namesStr
    .split(delimiter)
    .map(name => name.trim())
    .filter(Boolean);
}

/**
 * Converts "Leonardo Pinheiro" to ABNT format "PINHEIRO, Leonardo"
 */
export function formatAbntAuthorName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toUpperCase();
  
  // Handle suffixes like Filho, Junior, Neto, Sobrinho
  const lastPart = parts[parts.length - 1];
  const suffixes = ['filho', 'junior', 'júnior', 'neto', 'sobrinho', 'segundo', 'terceiro'];
  
  let surname = lastPart.toUpperCase();
  let givenNames = parts.slice(0, parts.length - 1).join(' ');
  
  if (parts.length > 2 && suffixes.includes(lastPart.toLowerCase())) {
    surname = `${parts[parts.length - 2]} ${lastPart}`.toUpperCase();
    givenNames = parts.slice(0, parts.length - 2).join(' ');
  }
  
  return `${surname}, ${givenNames}`;
}

/**
 * Converts "Leonardo Pinheiro" to APA format "Pinheiro, L."
 */
export function formatApaAuthorName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  
  const lastPart = parts[parts.length - 1];
  const givenParts = parts.slice(0, parts.length - 1);
  const initials = givenParts.map(p => `${p.charAt(0).toUpperCase()}.`).join(' ');
  
  return `${lastPart}, ${initials}`;
}

/**
 * Generates an ABNT NBR 6023 reference for a book
 */
export function generateAbntBookCitation(book: CitationBookMetadata): string {
  const isOrganized = !book.authors && !!book.organizers;
  const rawAuthors = isOrganized ? book.organizers : book.authors;
  const authorList = parseAuthorNames(rawAuthors);
  
  let authorsFormatted = '';
  if (authorList.length > 0) {
    authorsFormatted = authorList.map(formatAbntAuthorName).join('; ');
    if (isOrganized) {
      authorsFormatted += authorList.length > 1 ? ' (orgs.).' : ' (org.).';
    } else {
      authorsFormatted += '.';
    }
  }

  const titlePart = book.subtitle 
    ? `${book.title}: ${book.subtitle}.`
    : `${book.title}.`;

  const editionPart = book.edition ? `${book.edition.replace(/[^0-9]/g, '') || book.edition}. ed.` : '';
  const city = book.city || 'Palmas';
  const publisher = book.publisher || 'Observatório Edições';
  const year = book.year || new Date().getFullYear();
  const imprint = `${city}: ${publisher}, ${year}.`;

  const pagesPart = book.pages ? `${book.pages} p.` : '';
  const isbnPart = book.isbn ? `ISBN ${book.isbn}.` : '';
  const doiClean = book.doi ? book.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : '';
  const doiPart = doiClean ? `DOI: https://doi.org/${doiClean}.` : '';

  return [
    authorsFormatted,
    titlePart,
    editionPart,
    imprint,
    pagesPart,
    isbnPart,
    doiPart,
  ].filter(Boolean).join(' ');
}

/**
 * Generates an APA 7th Edition reference for a book
 */
export function generateApaBookCitation(book: CitationBookMetadata): string {
  const isOrganized = !book.authors && !!book.organizers;
  const rawAuthors = isOrganized ? book.organizers : book.authors;
  const authorList = parseAuthorNames(rawAuthors);
  
  let authorsFormatted = '';
  if (authorList.length === 1) {
    authorsFormatted = `${formatApaAuthorName(authorList[0])}${isOrganized ? ' (Ed.)' : ''}`;
  } else if (authorList.length > 1) {
    const formatted = authorList.map(formatApaAuthorName);
    authorsFormatted = `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}${isOrganized ? ' (Eds.)' : ''}`;
  }

  const year = book.year || new Date().getFullYear();
  const yearPart = `(${year}).`;

  let titlePart = book.subtitle ? `${book.title}: ${book.subtitle}` : book.title;
  if (book.edition) {
    const cleanEd = book.edition.replace(/[^0-9]/g, '') || book.edition;
    titlePart += ` (${cleanEd}th ed.)`;
  }
  titlePart += '.';

  const publisher = book.publisher || 'Observatório Edições';
  const publisherPart = `${publisher}.`;

  const doiClean = book.doi ? book.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : '';
  const doiPart = doiClean ? `https://doi.org/${doiClean}` : (book.url || '');

  return [
    authorsFormatted,
    yearPart,
    titlePart,
    publisherPart,
    doiPart,
  ].filter(Boolean).join(' ');
}

/**
 * Generates an ABNT NBR 6023 reference for a chapter within a book
 */
export function generateAbntChapterCitation(chapter: CitationChapterMetadata): string {
  const chapterAuthorList = parseAuthorNames(chapter.chapterAuthors);
  const chapterAuthorsFormatted = chapterAuthorList.length > 0
    ? `${chapterAuthorList.map(formatAbntAuthorName).join('; ')}.`
    : '';

  const chapterTitlePart = `${chapter.chapterTitle}.`;

  const isOrganized = !chapter.book.authors && !!chapter.book.organizers;
  const rawBookAuthors = isOrganized ? chapter.book.organizers : chapter.book.authors;
  const bookAuthorList = parseAuthorNames(rawBookAuthors);
  let bookAuthorsFormatted = '';
  if (bookAuthorList.length > 0) {
    bookAuthorsFormatted = bookAuthorList.map(formatAbntAuthorName).join('; ');
    bookAuthorsFormatted += isOrganized ? (bookAuthorList.length > 1 ? ' (orgs.).' : ' (org.).') : '.';
  }

  const bookTitlePart = chapter.book.subtitle
    ? `${chapter.book.title}: ${chapter.book.subtitle}.`
    : `${chapter.book.title}.`;

  const city = chapter.book.city || 'Palmas';
  const publisher = chapter.book.publisher || 'Observatório Edições';
  const year = chapter.book.year || new Date().getFullYear();
  const imprint = `${city}: ${publisher}, ${year}.`;

  const pagesPart = (chapter.startPage && chapter.endPage) 
    ? `p. ${chapter.startPage}-${chapter.endPage}.`
    : '';

  const doiClean = chapter.chapterDoi ? chapter.chapterDoi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : '';
  const doiPart = doiClean ? `DOI: https://doi.org/${doiClean}.` : '';

  return [
    chapterAuthorsFormatted,
    chapterTitlePart,
    `In: ${bookAuthorsFormatted}`,
    bookTitlePart,
    imprint,
    pagesPart,
    doiPart,
  ].filter(Boolean).join(' ');
}

/**
 * Generates a BibTeX entry for a book
 */
export function generateBibtexBookCitation(book: CitationBookMetadata, id: string = 'obra'): string {
  const authors = parseAuthorNames(book.authors || book.organizers).join(' and ');
  const year = book.year || new Date().getFullYear();
  const publisher = book.publisher || 'Observatório Edições';
  const address = book.city || 'Palmas, TO';
  const doi = book.doi ? book.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : '';

  return `@book{observatorio_${id.slice(0, 8)},
  title = {${book.title}${book.subtitle ? ': ' + book.subtitle : ''}},
  author = {${authors}},
  year = {${year}},
  publisher = {${publisher}},
  address = {${address}}${book.isbn ? `,\n  isbn = {${book.isbn}}` : ''}${doi ? `,\n  doi = {${doi}}` : ''}
}`;
}
