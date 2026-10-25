/**
 * POST /api/publish  (função serverless da Vercel)
 *
 * Pede um novo deploy do site para atualizar o catálogo estático.
 * Só funciona para quem está logado no painel como administrador ou editor.
 *
 * Variável de ambiente necessária na Vercel:
 *   VERCEL_DEPLOY_HOOK_URL  URL do "Deploy Hook" (Settings > Git > Deploy Hooks)
 * Opcional:
 *   ADMIN_EMAILS            e-mails extras autorizados, separados por vírgula
 */
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

// Mesmos e-mails "administradores iniciais" definidos em firestore.rules.
const BOOTSTRAP_ADMINS = ['leonardo.pinheirolk@gmail.com', 'leonardo.pinheiro@uft.edu.br'];

let lastTrigger = 0;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hookUrl) {
    return res.status(500).json({
      error: 'A variável VERCEL_DEPLOY_HOOK_URL ainda não foi configurada na Vercel.',
    });
  }

  const header = req.headers.authorization || '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!idToken) return res.status(401).json({ error: 'Faça login no painel para publicar.' });

  try {
    // 1) Confere o login (token do Firebase) com o serviço do Google.
    const lookup = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!lookup.ok) return res.status(401).json({ error: 'Login inválido ou expirado. Entre novamente.' });
    const user = ((await lookup.json()).users || [])[0];
    if (!user) return res.status(401).json({ error: 'Login inválido ou expirado. Entre novamente.' });

    // 2) Confere se a pessoa é administradora/editora.
    const email = String(user.email || '').toLowerCase();
    const allowed = new Set([
      ...BOOTSTRAP_ADMINS,
      ...String(process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ]);
    let authorized = allowed.has(email);

    if (!authorized) {
      // Equipe cadastrada em "Configurações" fica na coleção admins/{uid}.
      const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
      const doc = await fetch(
        `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${encodeURIComponent(dbId)}/documents/admins/${encodeURIComponent(user.localId)}`,
        { headers: { Authorization: `Bearer ${idToken}` } },
      );
      authorized = doc.ok;
    }
    if (!authorized) return res.status(403).json({ error: 'Seu usuário não tem permissão para publicar.' });

    // 3) Evita pedidos repetidos em sequência.
    const now = Date.now();
    if (now - lastTrigger < 30_000) {
      return res.status(429).json({ error: 'Uma publicação acabou de ser pedida. Aguarde alguns segundos.' });
    }
    lastTrigger = now;

    // 4) Pede o novo deploy.
    const hook = await fetch(hookUrl, { method: 'POST' });
    if (!hook.ok) {
      lastTrigger = 0;
      return res.status(502).json({ error: `A Vercel recusou o pedido de publicação (erro ${hook.status}).` });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('publish error:', err);
    return res.status(500).json({ error: 'Erro inesperado ao pedir a publicação.' });
  }
}
