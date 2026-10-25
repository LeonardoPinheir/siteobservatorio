/**
 * Observatório Edições - Zenodo API Integration
 * Fetches public bibliographic metadata from Zenodo REST API
 */

import { extractZenodoId } from './validators';

export interface ZenodoRecordMetadata {
  id: string;
  title: string;
  doi?: string;
  publicationDate?: string;
  description?: string;
  creators: { name: string; affiliation?: string; orcid?: string }[];
  license?: string;
  recordUrl: string;
}

/**
 * Fetches public metadata from Zenodo API
 * @param recordInput Full URL (e.g. https://zenodo.org/records/123456) or raw numeric ID
 */
export async function fetchZenodoRecord(recordInput: string): Promise<ZenodoRecordMetadata | null> {
  const id = extractZenodoId(recordInput);
  if (!id) return null;

  try {
    const response = await fetch(`https://zenodo.org/api/records/${id}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Zenodo API responded with status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const metadata = data.metadata || {};

    const creators = (metadata.creators || []).map((c: any) => ({
      name: c.name || '',
      affiliation: c.affiliation || '',
      orcid: c.orcid || '',
    }));

    return {
      id: String(data.id || id),
      title: metadata.title || '',
      doi: data.doi || metadata.doi || '',
      publicationDate: metadata.publication_date || '',
      description: metadata.description ? metadata.description.replace(/<[^>]*>/g, '') : '',
      creators,
      license: metadata.license?.id || metadata.license || 'cc-by-4.0',
      recordUrl: `https://zenodo.org/records/${id}`,
    };
  } catch (error) {
    console.error('Failed to fetch Zenodo metadata:', error);
    return null;
  }
}
