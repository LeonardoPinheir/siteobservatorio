import React, { useState } from 'react';
import { Message } from '../types';
import { X, Mail, User, Calendar, Trash2, CheckCircle2, Clock, Reply } from 'lucide-react';

interface MessageDetailModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (message: Message) => Promise<void>;
  onDelete: (id: string, title: string) => void;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  message,
  isOpen,
  onClose,
  onToggleStatus,
  onDelete,
}) => {
  if (!isOpen || !message) return null;

  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await onToggleStatus(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não informada';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const replyMailto = `mailto:${message.email}?subject=${encodeURIComponent(
    `Re: ${message.subject || 'Contato - Observatório Edições'}`
  )}&body=${encodeURIComponent(
    `\n\n--- Mensagem original recebida em ${formatDate(message.date)} ---\nDe: ${message.name} <${message.email}>\nAssunto: ${message.subject}\n\n${message.content}`
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#0c2338] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold">Mensagem de Contato</h3>
              <p className="text-xs text-slate-300">Enviada através do portal Observatório Edições</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          
          {/* Status & Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Situação:</span>
              {message.status === 'Lida' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Mensagem Lida
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Não Lida (Pendente)
                </span>
              )}
            </div>

            <button
              onClick={handleToggle}
              disabled={isUpdating}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline disabled:opacity-50"
            >
              {message.status === 'Lida' ? 'Marcar como Não Lida' : 'Marcar como Lida'}
            </button>
          </div>

          {/* Sender & Meta Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Remetente
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <User size={15} className="text-slate-400 shrink-0" />
                <span>{message.name || 'Nome não informado'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <a href={`mailto:${message.email}`} className="hover:underline">
                  {message.email}
                </a>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Data do Envio
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <span>{formatDate(message.date)}</span>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Assunto
            </span>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900">
              {message.subject || 'Sem assunto especificado'}
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Conteúdo da Mensagem
            </span>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed font-editorial whitespace-pre-wrap min-h-[140px]">
              {message.content || 'Mensagem sem conteúdo.'}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onDelete(message.id, message.subject || message.name);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={14} /> Excluir Mensagem
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Fechar
            </button>
            <a
              href={replyMailto}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Reply size={14} /> Responder por E-mail
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
