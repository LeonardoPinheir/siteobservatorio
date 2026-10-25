#!/usr/bin/env node
/**
 * Gera public/data/catalog.json: uma cópia estática do catálogo público.
 *
 * Roda automaticamente antes do `vite build` (a cada deploy na Vercel).
 * Lê o Firestore uma única vez, sem login, usando só o que as regras de
 * segurança já deixam qualquer pessoa ler (livros "Publicado", capítulos,
 * coleções, chamadas, equipe e modelo de submissão).
 *
 * Assim, quem visita o site lê um arquivo estático da CDN e não consome a
 * cota do Firestore.
 *
 * Se a leitura falhar:
 *  - existindo um public/data/catalog.json anterior, ele é mantido;
 *  - se o banco do Firestore simplesmente não existe, publica o site com o
 *    catálogo vazio (e avisa no log);
 *  - nos demais erros (cota, rede, regras), o build falha de propósito. Na
 *    Vercel, isso mantém no ar a versão anterior do site em vez de publicar
 *    um catálogo vazio.
 */
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'public', 'data', 'catalog.json');

const cfg = JSON.parse(await readFile(path.join(root, 'firebase-applet-config.json'), 'utf8'));
const BASE = (process.env.FIRESTORE_BASE_URL || 'https://firestore.googleapis.com').replace(/\/$/, '');
const dbId = cfg.firestoreDatabaseId || '(default)';
const DOCS = `${BASE}/v1/projects/${cfg.projectId}/databases/${encodeURIComponent(dbId)}/documents`;
const KEY = `key=${encodeURIComponent(cfg.apiKey)}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- Conversão do formato REST do Firestore para JSON simples ----------------
function fromValue(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
  if ('mapValue' in v) return fromFields(v.mapValue.fields || {});
  if ('referenceValue' in v) return v.referenceValue;
  if ('geoPointValue' in v) return v.geoPointValue;
  if ('bytesValue' in v) return v.bytesValue;
  return null;
}
const fromFields = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromValue(v)]));
const fromDoc = (d) => ({ id: d.name.split('/').pop(), ...fromFields(d.fields || {}) });

// ---- Requisições ----------------------------------------------------------------
async function request(url, init = {}, attempt = 1) {
  let res;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
  } catch (e) {
    if (attempt < 3) {
      await sleep(1000 * attempt);
      return request(url, init, attempt + 1);
    }
    throw new Error(`falha de rede ao acessar o Firestore: ${e.message}`);
  }
  if (res.ok) return res.json();

  const body = (await res.text().catch(() => '')).slice(0, 300);
  if (res.status === 404 && /does not exist/i.test(body)) {
    const err = new Error(
      `O banco "${dbId}" não existe no projeto ${cfg.projectId} (crie o banco no Firebase ou ajuste firestoreDatabaseId em firebase-applet-config.json).`,
    );
    err.code = 'DB_MISSING';
    throw err;
  }
  if (res.status === 429) {
    throw new Error(
      'A cota gratuita diária do Firestore está esgotada (erro 429). Ela renova todo dia; publique de novo mais tarde.',
    );
  }
  if (res.status === 403) {
    throw new Error(
      `O Firestore recusou a leitura pública (403). Confira se as regras publicadas no Firebase permitem a leitura. Detalhe: ${body}`,
    );
  }
  if (res.status >= 500 && attempt < 3) {
    await sleep(1000 * attempt);
    return request(url, init, attempt + 1);
  }
  throw new Error(`O Firestore respondeu ${res.status}: ${body}`);
}

async function listCollection(name) {
  const out = [];
  let pageToken = '';
  do {
    const url =
      `${DOCS}/${name}?pageSize=300&${KEY}` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
    const data = await request(url);
    for (const d of data.documents || []) out.push(fromDoc(d));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return out;
}

// As regras só liberam livros com status "Publicado", então a consulta
// precisa trazer exatamente esse filtro.
async function listPublishedBooks() {
  const data = await request(`${DOCS}:runQuery?${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'books' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'status' },
            op: 'EQUAL',
            value: { stringValue: 'Publicado' },
          },
        },
      },
    }),
  });
  return data.filter((r) => r.document).map((r) => fromDoc(r.document));
}

// ---- Principal ------------------------------------------------------------------
async function build() {
  const [books, chapters, collections, calls, team, templates] = await Promise.all([
    listPublishedBooks(),
    listCollection('chapters'),
    listCollection('collections'),
    listCollection('open_calls'),
    listCollection('team_members'),
    listCollection('submission_templates'),
  ]);

  const publishedIds = new Set(books.map((b) => b.id));
  const catalog = {
    generatedAt: new Date().toISOString(),
    books,
    // só capítulos de livros publicados
    chapters: chapters.filter((c) => publishedIds.has(c.bookId)),
    collections,
    calls,
    team,
    template: templates[0] || null,
  };

  await mkdir(path.dirname(outFile), { recursive: true });
  const tmp = `${outFile}.tmp`;
  await writeFile(tmp, JSON.stringify(catalog));
  await rename(tmp, outFile);

  console.log(
    `[catálogo] ${catalog.books.length} livros, ${catalog.chapters.length} capítulos, ` +
      `${catalog.collections.length} coleções, ${catalog.calls.length} chamadas, ` +
      `${catalog.team.length} pessoas na equipe. Gravado em public/data/catalog.json`,
  );
}

try {
  await build();
} catch (err) {
  console.error(`[catálogo] Não foi possível ler o Firestore: ${err.message}`);
  let previous = null;
  try {
    previous = JSON.parse(await readFile(outFile, 'utf8'));
  } catch {
    // sem cópia anterior
  }
  if (previous && Array.isArray(previous.books)) {
    console.warn(
      `[catálogo] Mantendo a cópia anterior (${previous.books.length} livros, gerada em ${previous.generatedAt}).`,
    );
  } else if (err.code === 'DB_MISSING') {
    // O banco não existe: não há livros para perder. Publica o site vazio
    // (com aviso) em vez de impedir o primeiro deploy.
    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(
      outFile,
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        books: [],
        chapters: [],
        collections: [],
        calls: [],
        team: [],
        template: null,
      }),
    );
    console.warn('[catálogo] ATENÇÃO: publicando o site com o catálogo VAZIO, porque o banco não existe.');
  } else {
    console.error('[catálogo] Não há cópia anterior. Interrompendo para não publicar um site vazio.');
    process.exit(1);
  }
}
