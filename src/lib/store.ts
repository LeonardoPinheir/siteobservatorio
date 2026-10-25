import { db, storage, auth, googleProvider, handleFirestoreError, OperationType } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  Book,
  Chapter,
  Author,
  EditorialCollection,
  Submission,
  SubmissionTemplate,
  Call,
  TeamMember,
  Message,
  AdminUser,
} from '../types';

export * from '../types';
export { db, storage, auth, googleProvider } from './firebase';

// Admin bootstrap constant
export const BOOTSTRAP_ADMIN_EMAIL = 'leonardo.pinheirolk@gmail.com';

// -------------------------------------------------------------
// Storage Helper
// -------------------------------------------------------------
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
};

export const uploadFileWithProgress = (
  file: File,
  folderPath: string,
  onProgress?: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Safety timeout: never let storage upload hang for more than 6 seconds
    const timeoutId = setTimeout(() => {
      reject(new Error('Tempo limite excedido na comunicação com o Storage.'));
    }, 6000);

    try {
      const sanitizedName = `${Date.now()}_${sanitizeFileName(file.name)}`;
      const storageRef = ref(storage, `${folderPath}/${sanitizedName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          clearTimeout(timeoutId);
          console.warn('Storage upload error (continuing with local data):', error);
          reject(error);
        },
        async () => {
          clearTimeout(timeoutId);
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    } catch (err) {
      clearTimeout(timeoutId);
      reject(err);
    }
  });
};

// Helper to strip undefined values so Firestore never throws 'Unsupported field value: undefined'
export function cleanPayload<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// -------------------------------------------------------------
// Authentication & Roles
// -------------------------------------------------------------
export async function getUserRole(user: FirebaseUser | null): Promise<'admin' | 'editor' | 'visitor'> {
  if (!user) return 'visitor';

  const userEmail = (user.email || '').toLowerCase().trim();
  const isBootstrap = userEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() || userEmail === 'leonardo.pinheiro@uft.edu.br';

  if (isBootstrap) {
    // Ensure document exists in admins/{user.uid} so firestore.rules security checks always succeed
    try {
      const adminDocRef = doc(db, 'admins', user.uid);
      const snap = await getDoc(adminDocRef);
      if (!snap.exists()) {
        await setDoc(adminDocRef, {
          email: userEmail,
          role: 'admin',
          displayName: user.displayName || userEmail,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      // Non-blocking background sync
    }
    return 'admin';
  }

  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      return (data.role as 'admin' | 'editor') || 'editor';
    }

    // Check by email in admins collection
    if (userEmail) {
      const q = query(collection(db, 'admins'), where('email', '==', userEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        try {
          await setDoc(doc(db, 'admins', user.uid), {
            email: userEmail,
            role: data.role || 'editor',
            displayName: user.displayName || userEmail,
            updated_at: new Date().toISOString(),
          });
        } catch {}
        return (data.role as 'admin' | 'editor') || 'editor';
      }
    }
  } catch (err) {
    console.warn('Error reading user role from Firestore:', err);
  }

  return 'visitor';
}

export async function loginWithGoogle(): Promise<{ user: FirebaseUser; role: 'admin' | 'editor' | 'visitor' }> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    const { setCachedDriveToken } = await import('./drive');
    setCachedDriveToken(credential.accessToken);
  }
  const role = await getUserRole(result.user);
  return { user: result.user, role };
}

export async function loginWithEmail(email: string, pass: string): Promise<{ user: FirebaseUser; role: 'admin' | 'editor' | 'visitor' }> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const role = await getUserRole(result.user);
  return { user: result.user, role };
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: FirebaseUser | null, role: 'admin' | 'editor' | 'visitor') => void) {
  return onAuthStateChanged(auth, async (user) => {
    const role = await getUserRole(user);
    callback(user, role);
  });
}

// -------------------------------------------------------------
// Seed Data (Realistic Academic Seed for Observatório Edições)
// -------------------------------------------------------------
const INITIAL_BOOKS: Omit<Book, 'id'>[] = [
  {
    title: 'Jornalismo Regional e Inovação na Amazônia Legal',
    subtitle: 'Práticas Midiáticas, Diversidade e Tecnologias Aplicadas',
    type: 'Livro autoral',
    edition: '1ª edição',
    year: 2024,
    publicationDate: '2024-05-15',
    volume: '1',
    collection: 'Comunicação e Sociedade',
    category: 'Ciências Sociais Aplicadas',
    language: 'Português',
    publisher: 'Observatório Edições / OPAJE-UFT',
    publicationCity: 'Palmas - TO, Brasil',
    authors: 'Leonardo Pinheiro; Gilson Pires',
    organizers: '',
    contributors: [
      { name: 'Leonardo Pinheiro', role: 'Autor', orcid: '0000-0002-1825-0097', institution: 'Universidade Federal do Tocantins (UFT)', country: 'Brasil' },
      { name: 'Gilson Pires', role: 'Autor', orcid: '0000-0001-5109-3700', institution: 'Universidade Federal do Tocantins (UFT)', country: 'Brasil' }
    ],
    isbn: '978-65-00-98712-4',
    isbnDigital: '978-65-00-98713-1',
    doi: '10.5281/zenodo.10892345',
    doiUrl: 'https://doi.org/10.5281/zenodo.10892345',
    zenodoUrl: 'https://zenodo.org/records/10892345',
    pages: 284,
    keywords: ['Jornalismo Regional', 'Amazônia Legal', 'Comunicação Comunitária', 'Inovação Editorial', 'Acesso Aberto'],
    abstract: 'A obra investiga as transformações nas rotinas produtivas de veículos jornalísticos e iniciativas comunicacionais no Tocantins e na Amazônia Legal. Analisa o impacto da digitalização, modelos cooperativos e o papel dos observatórios de mídia no fortalecimento da cidadania e da transparência democrática.',
    synopsis: 'Um estudo aprofundado sobre o ecossistema comunicacional do Centro-Norte brasileiro, integrando rigor metodológico e reflexão crítica sobre a prática jornalística contemporânea.',
    license: 'Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadLink: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    statisticsUrl: '',
    status: 'Publicado',
    isFeatured: true,
  },
  {
    title: 'Metodologias Ativas e Práticas Pedagógicas no Ensino Superior',
    subtitle: 'Experiências Interdisciplinares e Extensão Universitária',
    type: 'Coletânea / Organizado',
    edition: '2ª edição revisada',
    year: 2024,
    publicationDate: '2024-03-10',
    volume: '2',
    collection: 'Educação e Sociedade',
    category: 'Ciências Humanas',
    language: 'Português',
    publisher: 'Observatório Edições / OPAJE-UFT',
    publicationCity: 'Palmas - TO, Brasil',
    authors: '',
    organizers: 'Maria Helena Rodrigues; Leonardo Pinheiro',
    contributors: [
      { name: 'Maria Helena Rodrigues', role: 'Organizador', orcid: '0000-0003-4211-8902', institution: 'UFT', country: 'Brasil' },
      { name: 'Leonardo Pinheiro', role: 'Organizador', orcid: '0000-0002-1825-0097', institution: 'UFT', country: 'Brasil' }
    ],
    isbn: '978-65-00-84321-9',
    isbnDigital: '978-65-00-84322-6',
    doi: '10.5281/zenodo.10781234',
    doiUrl: 'https://doi.org/10.5281/zenodo.10781234',
    zenodoUrl: 'https://zenodo.org/records/10781234',
    pages: 312,
    keywords: ['Educação Superior', 'Metodologias Ativas', 'Extensão Universitária', 'Interdisciplinaridade'],
    abstract: 'Reunião de artigos e relatos de experiência sobre inovação pedagógica na graduação e pós-graduação. Aborda aprendizagem baseada em problemas, projetos integradores comunitários e ferramentas digitais abertas no contexto universitário.',
    synopsis: 'Coletânea essencial para educadores, gestores acadêmicos e pesquisadores comprometidos com a renovação do ensino universitário.',
    license: 'Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadLink: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'Publicado',
    isFeatured: true,
  },
  {
    title: 'Cultura, Patrimônio e Narrativas Visuais do Cerrado',
    subtitle: 'Memória Oral e Documentação Etnográfica',
    type: 'E-book',
    edition: '1ª edição',
    year: 2023,
    publicationDate: '2023-11-20',
    volume: '',
    collection: 'Memória e Território',
    category: 'Ciências Humanas',
    language: 'Português',
    publisher: 'Observatório Edições / OPAJE-UFT',
    publicationCity: 'Palmas - TO, Brasil',
    authors: 'Clara Albuquerque; Carlos Eduardo Mota',
    organizers: '',
    contributors: [
      { name: 'Clara Albuquerque', role: 'Autor', orcid: '0000-0002-9988-1122', institution: 'Universidade Federal do Tocantins', country: 'Brasil' },
      { name: 'Carlos Eduardo Mota', role: 'Autor', orcid: '0000-0001-7766-5544', institution: 'Instituto Federal do Tocantins', country: 'Brasil' }
    ],
    isbn: '978-65-00-71234-8',
    isbnDigital: '978-65-00-71235-5',
    doi: '10.5281/zenodo.10654321',
    doiUrl: 'https://doi.org/10.5281/zenodo.10654321',
    zenodoUrl: 'https://zenodo.org/records/10654321',
    pages: 198,
    keywords: ['Cerrado', 'Patrimônio Imaterial', 'Etnografia Visual', 'Memória Cultural'],
    abstract: 'Um registro etnográfico e iconográfico das comunidades tradicionais, festejos populares e saberes do bioma Cerrado tocantinense. A obra conjuga textos analíticos com ensaios fotográficos de alto valor historiográfico.',
    synopsis: 'Uma celebração da riqueza cultural e ambiental do coração do Brasil através de narrativas poéticas e pesquisa de campo.',
    license: 'Creative Commons Atribuição-NãoComercial 4.0 Internacional (CC BY-NC 4.0)',
    coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1000',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadLink: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'Publicado',
    isFeatured: false,
  }
];

const INITIAL_COLLECTIONS: Omit<EditorialCollection, 'id'>[] = [
  { title: 'Comunicação e Sociedade', description: 'Obras dedicadas aos estudos contemporâneos de comunicação, jornalismo e mídia.', slug: 'comunicacao-e-sociedade', order: 1 },
  { title: 'Educação e Sociedade', description: 'Pesquisas em processos formativos, metodologias ativas e políticas educacionais.', slug: 'educacao-e-sociedade', order: 2 },
  { title: 'Memória e Território', description: 'Registros etnográficos, patrimônio cultural e identidades regionais.', slug: 'memoria-e-territorio', order: 3 },
  { title: 'Ciência Aberta e Inovação', description: 'Publicações sobre divulgação científica, preservação digital e dados abertos.', slug: 'ciencia-aberta-e-inovacao', order: 4 },
];

const INITIAL_CALLS: Omit<Call, 'id'>[] = [
  {
    title: 'Chamada para Capítulos: Coletânea Inteligência Artificial e Sociedade no Sul Global',
    description: 'Submissão de propostas de capítulos para obra coletiva a ser publicada pelo selo Observatório Edições no segundo semestre.',
    deadline: '2026-12-15',
    status: 'Aberta',
    link: '/submissoes',
  },
  {
    title: 'Edital Contínuo de Publicação de Livros Autorais e E-books Acadêmicos',
    description: 'Recebimento em fluxo contínuo de manuscritos resultantes de teses, dissertações e pesquisas consolidadas.',
    deadline: '2026-12-31',
    status: 'Aberta',
    link: '/submissoes',
  }
];

const INITIAL_TEAM: Omit<TeamMember, 'id'>[] = [
  { name: 'Prof. Dr. Leonardo Pinheiro', role: 'Editor-Chefe e Coordenador Geral', institution: 'Universidade Federal do Tocantins (UFT / OPAJE)', order: 1 },
  { name: 'Prof. Dr. Gilson Pires', role: 'Membro do Conselho Editorial', institution: 'Universidade Federal do Tocantins (UFT)', order: 2 },
  { name: 'Profa. Dra. Maria Helena Rodrigues', role: 'Membro do Conselho Editorial', institution: 'Universidade Federal do Tocantins (UFT)', order: 3 },
  { name: 'Equipe de Editoração e Design', role: 'Comitê Técnico e Preservação Digital', institution: 'Observatório Edições', order: 4 },
];

// Initialize database with seed data if books collection is empty
export async function initializeSeedData(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'books'));
    if (!snap.empty) return; // Already has data

    console.log('Seeding initial academic catalog in Firestore...');
    
    // Seed books
    for (const b of INITIAL_BOOKS) {
      const bookDoc = await addDoc(collection(db, 'books'), {
        ...b,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Add sample chapters for the collection book
      if (b.type === 'Coletânea / Organizado') {
        const sampleChapters = [
          {
            bookId: bookDoc.id,
            chapterNumber: 1,
            order: 1,
            title: 'Aprendizagem Baseada em Projetos no Ensino de Jornalismo',
            authors: 'Leonardo Pinheiro; Gilson Pires',
            startPage: 15,
            endPage: 42,
            doi: '10.5281/zenodo.10781235',
            abstract: 'Exposição metodológica da implementação de redações laboratoriais integradas à comunidade.',
            keywords: ['Jornalismo laboratorial', 'Metodologias Ativas'],
            pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            created_at: new Date().toISOString(),
          },
          {
            bookId: bookDoc.id,
            chapterNumber: 2,
            order: 2,
            title: 'Extensão Universitária e Tecnologias Comunitárias no Tocantins',
            authors: 'Maria Helena Rodrigues',
            startPage: 43,
            endPage: 78,
            doi: '10.5281/zenodo.10781236',
            abstract: 'Reflexões sobre a presença das universidades públicas no interior tocantinense.',
            keywords: ['Extensão universitária', 'Comunidade'],
            pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            created_at: new Date().toISOString(),
          }
        ];

        for (const c of sampleChapters) {
          await addDoc(collection(db, 'chapters'), c);
        }
      }
    }

    // Seed collections
    for (const col of INITIAL_COLLECTIONS) {
      await addDoc(collection(db, 'collections'), {
        ...col,
        created_at: new Date().toISOString(),
      });
    }

    // Seed calls
    for (const c of INITIAL_CALLS) {
      await addDoc(collection(db, 'open_calls'), {
        ...c,
        created_at: new Date().toISOString(),
      });
    }

    // Seed team
    for (const t of INITIAL_TEAM) {
      await addDoc(collection(db, 'team_members'), {
        ...t,
        created_at: new Date().toISOString(),
      });
    }

    console.log('Seed completed successfully.');
  } catch (error) {
    console.warn('Seed initialization error (ignorable if offline or permissions restricted):', error);
  }
}

// -------------------------------------------------------------
// Books CRUD
// -------------------------------------------------------------
export async function getBooks(onlyPublished = false): Promise<Book[]> {
  try {
    const coll = collection(db, 'books');
    let q;
    if (onlyPublished) {
      q = query(coll, where('status', '==', 'Publicado'));
    } else {
      q = query(coll);
    }
    const snapshot = await getDocs(q);
    const dbBooks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Book));

    // Sort in memory by created_at desc (fast, zero composite index errors)
    dbBooks.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    return dbBooks;
  } catch (err) {
    console.warn('Error fetching books from Firestore:', err);
    return [];
  }
}

export async function getBookById(id: string): Promise<Book | undefined> {
  if (!id) return undefined;

  try {
    const docRef = doc(db, 'books', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Book;
    }
  } catch (err) {
    console.warn(`Firestore getBookById(${id}) warning:`, err);
  }

  return undefined;
}

export async function addBook(bookData: Omit<Book, 'id'>): Promise<Book> {
  try {
    const timestamp = new Date().toISOString();
    const dataToSave = cleanPayload({
      ...bookData,
      created_at: timestamp,
      updated_at: timestamp,
    });
    const refDoc = await addDoc(collection(db, 'books'), dataToSave);
    window.dispatchEvent(new Event('booksUpdated'));
    return { id: refDoc.id, ...dataToSave } as Book;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'books');
    throw err;
  }
}

export async function updateBook(id: string, updates: Partial<Book>): Promise<void> {
  try {
    const docRef = doc(db, 'books', id);
    const dataToUpdate = cleanPayload({
      ...updates,
      updated_at: new Date().toISOString(),
    });
    await updateDoc(docRef, dataToUpdate);
    window.dispatchEvent(new Event('booksUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `books/${id}`);
    throw err;
  }
}

export async function deleteBook(id: string): Promise<void> {
  try {
    // Delete linked chapters first if any exist in Firestore
    try {
      const q = query(collection(db, 'chapters'), where('bookId', '==', id));
      const chapSnap = await getDocs(q);
      for (const ch of chapSnap.docs) {
        await deleteDoc(doc(db, 'chapters', ch.id));
      }
    } catch (chapErr) {
      console.warn('Chapter cleanup warning for book:', id, chapErr);
    }

    await deleteDoc(doc(db, 'books', id));
    window.dispatchEvent(new Event('booksUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `books/${id}`);
    throw err;
  }
}

export async function updateBookStatusesBulk(ids: string[], status: Book['status']): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const id of ids) {
      const docRef = doc(db, 'books', id);
      batch.update(docRef, {
        status,
        updated_at: new Date().toISOString(),
      });
    }
    await batch.commit();
    window.dispatchEvent(new Event('booksUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'books/bulk');
    throw err;
  }
}

// -------------------------------------------------------------
// Chapters CRUD
// -------------------------------------------------------------
export async function getChaptersByBookId(bookId: string): Promise<Chapter[]> {
  try {
    const q = query(collection(db, 'chapters'), where('bookId', '==', bookId));
    const snapshot = await getDocs(q);
    const chapters = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Chapter));
    return chapters.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  } catch (err) {
    console.warn('Firestore getChaptersByBookId notice:', err);
    return [];
  }
}

export async function getAllChapters(): Promise<Chapter[]> {
  try {
    const snap = await getDocs(collection(db, 'chapters'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chapter));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'chapters');
    return [];
  }
}

export async function addChapter(chapterData: Omit<Chapter, 'id'>): Promise<Chapter> {
  try {
    const timestamp = new Date().toISOString();
    const data = {
      ...chapterData,
      created_at: timestamp,
      updated_at: timestamp,
    };
    const refDoc = await addDoc(collection(db, 'chapters'), data);
    window.dispatchEvent(new Event('chaptersUpdated'));
    return { id: refDoc.id, ...data } as Chapter;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'chapters');
    throw err;
  }
}

export async function updateChapter(id: string, updates: Partial<Chapter>): Promise<void> {
  try {
    const docRef = doc(db, 'chapters', id);
    await updateDoc(docRef, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    window.dispatchEvent(new Event('chaptersUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chapters/${id}`);
    throw err;
  }
}

export async function deleteChapter(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'chapters', id));
    window.dispatchEvent(new Event('chaptersUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `chapters/${id}`);
    throw err;
  }
}

// -------------------------------------------------------------
// Authors Directory CRUD
// -------------------------------------------------------------
export async function getAuthors(): Promise<Author[]> {
  try {
    const snap = await getDocs(query(collection(db, 'authors'), orderBy('name', 'asc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Author));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'authors');
    return [];
  }
}

export async function addAuthor(authorData: Omit<Author, 'id'>): Promise<Author> {
  try {
    const data = { ...authorData, created_at: new Date().toISOString() };
    const refDoc = await addDoc(collection(db, 'authors'), data);
    window.dispatchEvent(new Event('authorsUpdated'));
    return { id: refDoc.id, ...data } as Author;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'authors');
    throw err;
  }
}

export async function updateAuthor(id: string, updates: Partial<Author>): Promise<void> {
  try {
    await updateDoc(doc(db, 'authors', id), updates);
    window.dispatchEvent(new Event('authorsUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `authors/${id}`);
    throw err;
  }
}

export async function deleteAuthor(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'authors', id));
    window.dispatchEvent(new Event('authorsUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `authors/${id}`);
    throw err;
  }
}

// -------------------------------------------------------------
// Editorial Collections CRUD
// -------------------------------------------------------------
export async function getCollections(): Promise<EditorialCollection[]> {
  try {
    const snap = await getDocs(collection(db, 'collections'));
    const dbCols = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EditorialCollection));
    return dbCols.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  } catch (err) {
    console.warn('getCollections warning:', err);
    return [];
  }
}

export async function addCollection(data: Omit<EditorialCollection, 'id'>): Promise<EditorialCollection> {
  try {
    const toSave = { ...data, created_at: new Date().toISOString() };
    const refDoc = await addDoc(collection(db, 'collections'), toSave);
    window.dispatchEvent(new Event('collectionsUpdated'));
    return { id: refDoc.id, ...toSave } as EditorialCollection;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'collections');
    throw err;
  }
}

export async function updateCollection(id: string, updates: Partial<EditorialCollection>): Promise<void> {
  try {
    await updateDoc(doc(db, 'collections', id), updates);
    window.dispatchEvent(new Event('collectionsUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `collections/${id}`);
    throw err;
  }
}

export async function deleteCollection(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'collections', id));
    window.dispatchEvent(new Event('collectionsUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `collections/${id}`);
    throw err;
  }
}

// -------------------------------------------------------------
// Submissions CRUD
// -------------------------------------------------------------
export async function getSubmissions(): Promise<Submission[]> {
  try {
    const snap = await getDocs(query(collection(db, 'submissions'), orderBy('date', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Submission));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'submissions');
    return [];
  }
}

export async function addSubmission(
  submission: Omit<Submission, 'id' | 'date' | 'status'> & { file?: File; driveToken?: string }
): Promise<Submission> {
  let fileUrl = submission.fileUrl || '';
  let driveFileId = '';
  let driveWebViewLink = '';

  // 1. Try uploading to Google Drive if access token is available
  if (submission.file) {
    try {
      const { getDriveAccessToken, uploadSubmissionToDrive } = await import('./drive');
      const token = submission.driveToken || await getDriveAccessToken(false);
      if (token) {
        const driveResult = await uploadSubmissionToDrive(
          submission.file,
          submission.name,
          submission.title,
          token
        );
        driveFileId = driveResult.fileId;
        driveWebViewLink = driveResult.webViewLink;
        fileUrl = driveResult.webViewLink || fileUrl;
      }
    } catch (driveErr) {
      console.warn('Google Drive direct upload skipped or failed:', driveErr);
    }
  }

  // 2. Upload to storage if not already saved to Drive
  if (submission.file && !fileUrl) {
    try {
      fileUrl = await uploadFileWithProgress(submission.file, 'submissions');
    } catch (uploadErr) {
      console.warn('Storage upload unavailable or timed out, continuing with file record:', uploadErr);
      fileUrl = '';
    }
  }

  try {
    const timestamp = new Date().toISOString();
    const dataToSave: any = {
      name: submission.name,
      email: submission.email,
      institution: submission.institution || '',
      orcid: submission.orcid || '',
      title: submission.title,
      workType: submission.workType || 'Livro autoral',
      thematicArea: submission.thematicArea || 'Ciências Humanas',
      abstract: submission.abstract,
      fileUrl,
      fileName: submission.fileName || (submission.file ? submission.file.name : ''),
      agreementAccepted: Boolean(submission.agreementAccepted),
      date: timestamp,
      status: 'Recebida',
      created_at: timestamp,
    };

    if (driveFileId) dataToSave.driveFileId = driveFileId;
    if (driveWebViewLink) dataToSave.driveWebViewLink = driveWebViewLink;

    const refDoc = await addDoc(collection(db, 'submissions'), dataToSave);
    window.dispatchEvent(new Event('submissionsUpdated'));
    return { id: refDoc.id, ...dataToSave } as Submission;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'submissions');
    throw err;
  }
}

export async function updateSubmissionStatus(id: string, status: Submission['status'], notes?: string): Promise<void> {
  try {
    const updateObj: any = { status };
    if (notes !== undefined) updateObj.notes = notes;
    await updateDoc(doc(db, 'submissions', id), updateObj);
    window.dispatchEvent(new Event('submissionsUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `submissions/${id}`);
    throw err;
  }
}

export async function deleteSubmission(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'submissions', id));
    window.dispatchEvent(new Event('submissionsUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `submissions/${id}`);
    throw err;
  }
}

// -------------------------------------------------------------
// Submission Template
// -------------------------------------------------------------
export async function getSubmissionTemplate(): Promise<SubmissionTemplate | null> {
  try {
    const snap = await getDocs(collection(db, 'submission_templates'));
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as SubmissionTemplate;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'submission_templates');
  }
  return null;
}

export async function updateSubmissionTemplate(template: Partial<SubmissionTemplate> & { file?: File }): Promise<void> {
  let fileUrl = template.fileUrl || '';
  if (template.file) {
    fileUrl = await uploadFileWithProgress(template.file, 'templates');
  }

  try {
    const data = {
      fileUrl,
      fileName: template.fileName || (template.file ? template.file.name : ''),
      updatedAt: new Date().toISOString(),
    };

    const snap = await getDocs(collection(db, 'submission_templates'));
    if (!snap.empty) {
      await updateDoc(doc(db, 'submission_templates', snap.docs[0].id), data);
    } else {
      await addDoc(collection(db, 'submission_templates'), data);
    }
    window.dispatchEvent(new Event('templateUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'submission_templates');
    throw err;
  }
}

// -------------------------------------------------------------
// Open Calls CRUD
// -------------------------------------------------------------
export async function getCalls(): Promise<Call[]> {
  try {
    const snap = await getDocs(collection(db, 'open_calls'));
    const dbCalls = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Call));
    return dbCalls.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.warn('getCalls warning:', err);
    return [];
  }
}

export async function addCall(call: Omit<Call, 'id'>): Promise<Call> {
  try {
    const data = { ...call, created_at: new Date().toISOString() };
    const refDoc = await addDoc(collection(db, 'open_calls'), data);
    window.dispatchEvent(new Event('callsUpdated'));
    return { id: refDoc.id, ...data } as Call;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'open_calls');
    throw err;
  }
}

export async function updateCall(id: string, updates: Partial<Call>): Promise<void> {
  try {
    await updateDoc(doc(db, 'open_calls', id), updates);
    window.dispatchEvent(new Event('callsUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `open_calls/${id}`);
    throw err;
  }
}

export async function deleteCall(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'open_calls', id));
    window.dispatchEvent(new Event('callsUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `open_calls/${id}`);
    throw err;
  }
}

// -------------------------------------------------------------
// Team Members CRUD
// -------------------------------------------------------------
export async function getTeam(): Promise<TeamMember[]> {
  try {
    const snap = await getDocs(collection(db, 'team_members'));
    const dbTeam = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TeamMember));
    return dbTeam.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  } catch (err) {
    console.warn('getTeam warning:', err);
    return [];
  }
}

export async function addTeamMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
  try {
    const data = { ...member, created_at: new Date().toISOString() };
    const refDoc = await addDoc(collection(db, 'team_members'), data);
    window.dispatchEvent(new Event('teamUpdated'));
    return { id: refDoc.id, ...data } as TeamMember;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'team_members');
    throw err;
  }
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
  try {
    await updateDoc(doc(db, 'team_members', id), updates);
    window.dispatchEvent(new Event('teamUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `team_members/${id}`);
    throw err;
  }
}

export async function deleteTeamMember(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'team_members', id));
    window.dispatchEvent(new Event('teamUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `team_members/${id}`);
    throw err;
  }
}

// -------------------------------------------------------------
// Contact Messages CRUD
// -------------------------------------------------------------
export async function getMessages(): Promise<Message[]> {
  try {
    let docsSnap;
    try {
      docsSnap = await getDocs(query(collection(db, 'messages'), orderBy('date', 'desc')));
    } catch {
      docsSnap = await getDocs(collection(db, 'messages'));
    }
    const msgs = docsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
    return msgs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'messages');
    return [];
  }
}

export async function addMessage(message: Omit<Message, 'id' | 'date' | 'status'>): Promise<Message> {
  try {
    const data = {
      ...message,
      date: new Date().toISOString(),
      status: 'Não lida' as const,
    };
    const refDoc = await addDoc(collection(db, 'messages'), data);
    window.dispatchEvent(new Event('messagesUpdated'));
    return { id: refDoc.id, ...data } as Message;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'messages');
    throw err;
  }
}

export async function updateMessageStatus(id: string, status: Message['status']): Promise<void> {
  try {
    await updateDoc(doc(db, 'messages', id), { status });
    window.dispatchEvent(new Event('messagesUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `messages/${id}`);
    throw err;
  }
}

export async function deleteMessage(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'messages', id));
    window.dispatchEvent(new Event('messagesUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `messages/${id}`);
    throw err;
  }
}

// -------------------------------------------------------------
// Admin Users Management
// -------------------------------------------------------------
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminUser));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'admins');
    return [];
  }
}

export async function setAdminUser(email: string, role: 'admin' | 'editor', displayName?: string): Promise<void> {
  try {
    const cleanId = email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    await setDoc(doc(db, 'admins', cleanId), {
      email: email.toLowerCase(),
      role,
      displayName: displayName || email,
      created_at: new Date().toISOString(),
    });
    window.dispatchEvent(new Event('adminsUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'admins');
    throw err;
  }
}

export async function removeAdminUser(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'admins', id));
    window.dispatchEvent(new Event('adminsUpdated'));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `admins/${id}`);
    throw err;
  }
}
