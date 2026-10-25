/**
 * Google Drive API Integration for Observatório Edições
 * Handles OAuth Scopes, In-memory token management,
 * and dedicated folder creation/uploading for:
 * 1. "Observatório Edições - Submissões"
 * 2. "Observatório Edições - Livros e Obras (PDFs)"
 */

import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

// Add Drive scope to GoogleAuthProvider instance
DRIVE_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

// In-memory token cache (DO NOT store in localStorage per guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Clear token on sign out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

/**
 * Obtain Google OAuth Access Token with Drive permissions
 */
export async function getDriveAccessToken(interactive = false): Promise<string | null> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  if (!interactive) {
    return null;
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Google.');
    }
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (error) {
    console.error('Google Drive Auth error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export function setCachedDriveToken(token: string | null) {
  cachedAccessToken = token;
}

export function hasDriveToken(): boolean {
  return Boolean(cachedAccessToken);
}

/**
 * Searches or creates a folder by name in Google Drive
 */
export async function getOrCreateDriveFolder(folderName: string, accessToken: string): Promise<string> {
  // Check if folder exists
  const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Erro ao buscar pasta no Drive (${searchRes.status}): ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Erro ao criar pasta no Drive: ${errText}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

export interface UploadToDriveResult {
  fileId: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
}

/**
 * Uploads a file (PDF/Doc) directly to a specific folder in Google Drive with multipart upload
 */
export async function uploadFileToDriveFolder(
  file: File,
  folderId: string,
  accessToken: string,
  customName?: string
): Promise<UploadToDriveResult> {
  const metadata = {
    name: customName || file.name,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Erro ao fazer upload para o Google Drive (${uploadRes.status}): ${errText}`);
  }

  return await uploadRes.json();
}

/**
 * High-level helper: upload a Submission file to "Observatório Edições - Submissões" folder
 */
export async function uploadSubmissionToDrive(
  file: File,
  authorName: string,
  title: string,
  accessToken: string
): Promise<UploadToDriveResult> {
  const folderId = await getOrCreateDriveFolder('Observatório Edições - Submissões', accessToken);
  const ext = file.name.split('.').pop() || 'pdf';
  const cleanTitle = title.slice(0, 50).replace(/[^a-zA-Z0-9À-ÿ ]/g, '').trim();
  const cleanAuthor = authorName.slice(0, 30).replace(/[^a-zA-Z0-9À-ÿ ]/g, '').trim();
  const customName = `Submissao_${cleanAuthor}_${cleanTitle}.${ext}`;

  return await uploadFileToDriveFolder(file, folderId, accessToken, customName);
}

/**
 * High-level helper: upload a Book PDF to "Observatório Edições - Livros (PDFs)" folder
 */
export async function uploadBookPdfToDrive(
  file: File,
  bookTitle: string,
  accessToken: string
): Promise<UploadToDriveResult> {
  const folderId = await getOrCreateDriveFolder('Observatório Edições - Livros (PDFs)', accessToken);
  const cleanTitle = bookTitle.slice(0, 60).replace(/[^a-zA-Z0-9À-ÿ -_]/g, '').trim();
  const customName = `${cleanTitle}.pdf`;

  return await uploadFileToDriveFolder(file, folderId, accessToken, customName);
}
