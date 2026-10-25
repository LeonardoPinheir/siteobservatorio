import React, { useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';
import { auth } from '../lib/store';

type Status = 'idle' | 'sending' | 'done' | 'error';

/**
 * O site público lê uma cópia estática do catálogo, gerada a cada deploy.
 * Depois de cadastrar ou editar livros, este botão pede um novo deploy
 * (via /api/publish) para a cópia ser atualizada. Leva cerca de 1 a 2 minutos.
 */
export function PublishSiteButton() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleClick = async () => {
    setStatus('sending');
    setMessage('');
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Entre novamente no painel e tente de novo.');

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // resposta sem JSON
      }

      if (res.status === 404) {
        throw new Error('A publicação automática só funciona no site publicado na Vercel.');
      }
      if (!res.ok) throw new Error(data.error || `Falha ao publicar (erro ${res.status}).`);

      setStatus('done');
      setMessage('Publicação iniciada. As mudanças aparecem no site em cerca de 1 a 2 minutos.');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 12000);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Não foi possível publicar.');
    }
  };

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span
          role="status"
          className={`max-w-xs text-xs ${status === 'error' ? 'text-red-600' : 'text-emerald-700'}`}
        >
          {message}
        </span>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'sending'}
        title="Atualiza o site público com os livros e dados cadastrados aqui"
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
      >
        {status === 'sending' ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
        {status === 'sending' ? 'Publicando...' : 'Publicar no site'}
      </button>
    </div>
  );
}
