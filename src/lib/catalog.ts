/**
 * Leitura do catálogo PÚBLICO do site.
 *
 * As páginas públicas (Início, Publicações, Detalhe do livro e Submissões)
 * leem o arquivo estático /data/catalog.json, gerado a cada deploy por
 * scripts/build-catalog.mjs. Isso não consome leituras do Firestore.
 *
 * O painel administrativo continua usando lib/store.ts (Firestore ao vivo).
 *
 * Se o arquivo não existir (por exemplo, rodando localmente sem ter gerado o
 * catálogo), as funções caem para o Firestore, para o site nunca ficar vazio.
 */
import type {
  Book,
  Chapter,
  EditorialCollection,
  Call,
  TeamMember,
  SubmissionTemplate,
} from '../types';

interface Catalog {
  generatedAt: string;
  books: Book[];
  chapters: Chapter[];
  collections: EditorialCollection[];
  calls: Call[];
  team: TeamMember[];
  template: SubmissionTemplate | null;
}

let catalogPromise: Promise<Catalog | null> | null = null;

function loadCatalog(): Promise<Catalog | null> {
  if (!catalogPromise) {
    // "no-cache": o navegador confirma com a CDN se o arquivo mudou (resposta 304,
    // quase sem custo) e assim mostra o catálogo novo logo após uma publicação.
    catalogPromise = fetch('/data/catalog.json', { cache: 'no-cache' })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return data && Array.isArray(data.books) ? (data as Catalog) : null;
      })
      .catch(() => null);
  }
  return catalogPromise;
}

const byDateDesc = (a?: string, b?: string) =>
  (b ? new Date(b).getTime() : 0) - (a ? new Date(a).getTime() : 0);
const byOrderAsc = (a?: number | string, b?: number | string) =>
  Number(a || 0) - Number(b || 0);

// Plano B: Firestore ao vivo (mesmas funções do painel).
async function live() {
  return import('./store');
}

export async function getBooks(_onlyPublished = true): Promise<Book[]> {
  const c = await loadCatalog();
  if (c) return [...c.books].sort((a, b) => byDateDesc(a.created_at, b.created_at));
  try {
    return await (await live()).getBooks(true);
  } catch {
    return [];
  }
}

export async function getBookById(id: string): Promise<Book | undefined> {
  if (!id) return undefined;
  const c = await loadCatalog();
  if (c) return c.books.find((b) => b.id === id);
  try {
    return await (await live()).getBookById(id);
  } catch {
    return undefined;
  }
}

export async function getChaptersByBookId(bookId: string): Promise<Chapter[]> {
  const c = await loadCatalog();
  if (c) {
    return c.chapters.filter((ch) => ch.bookId === bookId).sort((a, b) => byOrderAsc(a.order, b.order));
  }
  try {
    return await (await live()).getChaptersByBookId(bookId);
  } catch {
    return [];
  }
}

export async function getCollections(): Promise<EditorialCollection[]> {
  const c = await loadCatalog();
  if (c) return [...c.collections].sort((a, b) => byOrderAsc(a.order, b.order));
  try {
    return await (await live()).getCollections();
  } catch {
    return [];
  }
}

export async function getCalls(): Promise<Call[]> {
  const c = await loadCatalog();
  if (c) return [...c.calls].sort((a, b) => byDateDesc(a.created_at, b.created_at));
  try {
    return await (await live()).getCalls();
  } catch {
    return [];
  }
}

export async function getTeam(): Promise<TeamMember[]> {
  const c = await loadCatalog();
  if (c) return [...c.team].sort((a, b) => byOrderAsc(a.order, b.order));
  try {
    return await (await live()).getTeam();
  } catch {
    return [];
  }
}

export async function getSubmissionTemplate(): Promise<SubmissionTemplate | null> {
  const c = await loadCatalog();
  if (c) return c.template;
  try {
    return await (await live()).getSubmissionTemplate();
  } catch {
    return null;
  }
}
