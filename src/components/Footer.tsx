import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Globe, ShieldCheck, BookOpen, Share2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0a1928] text-slate-300 border-t border-slate-800">
      {/* Upper Footer: Main Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: Publisher Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo_observatorio.png"
                alt="Observatório Edições"
                className="h-12 w-auto object-contain brightness-0 invert opacity-95"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-semibold text-lg text-white tracking-tight">
                Observatório Edições
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-editorial">
              Selo editorial acadêmico dedicado à publicação, difusão e preservação da produção científica, cultural e pedagógica em acesso aberto irrestrito.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-amber-400 font-medium">
              <ShieldCheck size={16} />
              <span>Acesso Aberto & Preservação Digital</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
              Navegação Editorial
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Página Inicial
                </Link>
              </li>
              <li>
                <Link to="/publicacoes" className="hover:text-white transition-colors">
                  Catálogo de Publicações
                </Link>
              </li>
              <li>
                <Link to="/submissoes" className="hover:text-white transition-colors">
                  Diretrizes para Submissão
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Área do Editor / Restrita
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Institutional Affiliation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
              Vínculo Institucional
            </h4>
            <p className="text-xs font-semibold text-white mb-1">
              Universidade Federal do Tocantins (UFT)
            </p>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Núcleo de Pesquisa e Extensão Observatório de Pesquisas Aplicadas ao Jornalismo e ao Ensino (OPAJE-UFT).
            </p>
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-start gap-1.5">
                <MapPin size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <span>Bloco 1, Salas 18-20, Campus Palmas - Av. NS 15, 109 Norte, Palmas - TO, 77001-090</span>
              </div>
            </div>
          </div>

          {/* Column 4: Contact & Channels */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
              Atendimento e Contato
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <a
                  href="mailto:opajeuft@gmail.com"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Mail size={15} className="text-amber-400" />
                  <span>opajeuft@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+556384028033"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Phone size={15} className="text-amber-400" />
                  <span>+55 (63) 8402-8033</span>
                </a>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                Palmas, Tocantins, Brasil
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Lower Bar */}
      <div className="border-t border-slate-800/80 bg-[#07121d] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} Observatório Edições — Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Licença Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
