import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithGoogle, logoutUser, subscribeToAuth } from '../lib/store';
import { ArrowLeft, AlertCircle, ShieldCheck, Lock, ExternalLink, Globe } from 'lucide-react';

export function Login() {
  const [error, setError] = useState('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Acesso Editorial Restrito | Observatório Edições';

    // If user is already authenticated as admin/editor, redirect to admin
    const unsubscribe = subscribeToAuth((currentUser, currentRole) => {
      if (currentUser && (currentRole === 'admin' || currentRole === 'editor')) {
        navigate('/admin');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setUnauthorizedDomain(null);
    setLoading(true);

    try {
      const { user, role } = await loginWithGoogle();
      if (role === 'admin' || role === 'editor') {
        navigate('/admin');
      } else {
        // Unregistered / unauthorized email: immediately clear auth session
        await logoutUser();
        setError(
          `Acesso não autorizado. A conta Google (${user.email || 'informada'}) não possui privilégios de acesso ao painel editorial. Apenas e-mails previamente cadastrados pela coordenação podem acessar o sistema.`
        );
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'www.observatorioedicoes.com.br';
        setUnauthorizedDomain(domain);
        setError(
          `O domínio "${domain}" ainda não foi adicionado aos Domínios Autorizados no Firebase Authentication do projeto Google Cloud.`
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        // Usuário fechou o pop-up sem autenticar
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Operação sobreposta
      } else if (err.code === 'auth/popup-blocked') {
        setError('O navegador bloqueou a janela pop-up do Google. Por favor, permita pop-ups para este site e tente novamente.');
      } else {
        setError(err.message || 'Falha ao autenticar com o Google. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* Left Column: Visual Brand Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0c2338] text-white items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 mx-auto flex items-center justify-center shadow-xl p-3">
            <img
              src="/logo_observatorio.png"
              alt="Observatório Edições"
              className="max-h-full max-w-full object-contain brightness-0 invert"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight font-classical">
            Observatório Edições
          </h1>

          <p className="text-sm text-slate-300 font-editorial italic leading-relaxed">
            "Acesso aberto ao conhecimento científico, fortalecimento da produção acadêmica e difusão das pesquisas na Amazônia Legal e no Brasil."
          </p>

          <div className="pt-6 border-t border-white/10 text-xs text-slate-400">
            Universidade Federal do Tocantins (UFT / OPAJE)
          </div>
        </div>
      </div>

      {/* Right Column: Sign-in Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 relative py-12">
        <Link
          to="/"
          className="absolute top-8 left-6 sm:left-12 lg:left-16 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao Portal Público
        </Link>

        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
              <ShieldCheck size={14} />
              Controle Editorial
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2.5 font-classical">
              Área Administrativa
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 font-editorial leading-relaxed">
              Autenticação de uso exclusivo para membros do conselho editorial, pareceristas e administradores autorizados.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl space-y-3 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1">
                  <span className="font-bold block text-rose-900">Aviso de Configuração de Domínio</span>
                  <span className="leading-relaxed block text-rose-700">{error}</span>
                </div>
              </div>

              {unauthorizedDomain && (
                <div className="pt-2 border-t border-rose-200/80 space-y-2 text-rose-900">
                  <p className="font-semibold text-[11px] leading-relaxed">
                    Como liberar o acesso pelo domínio <span className="underline font-mono">{unauthorizedDomain}</span>:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-rose-800">
                    <li>
                      Abra o console do Firebase no projeto <span className="font-mono font-bold">gen-lang-client-0053797401</span>.
                    </li>
                    <li>
                      Vá em <strong>Authentication</strong> &rarr; aba <strong>Configurações</strong> &rarr; <strong>Domínios autorizados</strong>.
                    </li>
                    <li>
                      Clique em <strong>Adicionar domínio</strong> e insira: <span className="font-mono bg-white px-1 py-0.5 rounded border border-rose-200">observatorioedicoes.com.br</span> e <span className="font-mono bg-white px-1 py-0.5 rounded border border-rose-200">www.observatorioedicoes.com.br</span>.
                    </li>
                  </ol>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0053797401/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                    >
                      <ExternalLink size={12} /> Abrir Configurações do Firebase
                    </a>
                    <a
                      href="https://ais-pre-fpjihidzd3jiyvujpsmvfq-344996905174.us-west2.run.app/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-lg font-bold text-[11px] transition-colors"
                    >
                      <Globe size={12} /> Acessar via URL do Contêiner
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Institutional Google Sign-In Card */}
          <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2 border border-blue-100">
                <Lock size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Entrada com Conta Google
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Utilize o e-mail Google cadastrado na coordenação editorial para acessar o gerenciamento de obras, chamadas e submissões.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 border border-slate-300 hover:border-slate-400 rounded-xl bg-white hover:bg-slate-50/80 text-slate-800 text-sm font-semibold shadow-xs hover:shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Verificando credenciais...' : 'Entrar com Conta Google'}</span>
            </button>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400 block leading-tight">
                Acesso restrito exclusivamente a contas cadastradas.
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
