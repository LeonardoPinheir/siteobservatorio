/**
 * Observatório Edições - Academic Validators
 */

/**
 * Validates an ORCID identifier (format: 0000-0000-0000-000X where X can be a digit or 'X')
 * Can accept full URL like https://orcid.org/0000-0002-1825-0097 or just the ID.
 */
export function isValidOrcid(orcid: string): boolean {
  if (!orcid || typeof orcid !== 'string') return false;
  const clean = orcid.trim().replace(/^https?:\/\/orcid\.org\//i, '');
  const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
  return orcidRegex.test(clean);
}

/**
 * Normalizes an ORCID into standard URL format https://orcid.org/0000-0000-0000-0000
 */
export function formatOrcidUrl(orcid: string): string {
  if (!orcid) return '';
  const clean = orcid.trim().replace(/^https?:\/\/orcid\.org\//i, '');
  return `https://orcid.org/${clean}`;
}

/**
 * Validates a DOI (Digital Object Identifier)
 * e.g., 10.1000/182 or https://doi.org/10.1000/182
 */
export function isValidDoi(doi: string): boolean {
  if (!doi || typeof doi !== 'string') return false;
  const clean = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;
  return doiRegex.test(clean);
}

/**
 * Normalizes a DOI into its standard canonical URL
 */
export function formatDoiUrl(doi: string): string {
  if (!doi) return '';
  const clean = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  return `https://doi.org/${clean}`;
}

/**
 * Validates an ISBN (ISBN-10 or ISBN-13)
 */
export function isValidIsbn(isbn: string): boolean {
  if (!isbn || typeof isbn !== 'string') return false;
  const clean = isbn.replace(/[-\s]/g, '');
  if (clean.length === 10) {
    return /^(\d{9}[\dX])$/.test(clean);
  }
  if (clean.length === 13) {
    return /^(978|979)\d{10}$/.test(clean);
  }
  return false;
}

/**
 * Formats ISBN with standard hyphens (for display)
 */
export function formatIsbn(isbn: string): string {
  if (!isbn) return '';
  const clean = isbn.replace(/[-\s]/g, '');
  if (clean.length === 13) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5, 8)}-${clean.slice(8, 12)}-${clean.slice(12)}`;
  }
  return isbn;
}

/**
 * Extracts Zenodo Record ID from a URL or raw ID
 */
export function extractZenodoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const match = trimmed.match(/(?:zenodo\.org\/records?\/|zenodo\.org\/record\/|^)(\d+)/i);
  return match ? match[1] : null;
}
