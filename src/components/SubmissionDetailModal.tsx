import React, { useState } from 'react';
import { Submission, SubmissionStatus } from '../types';
import { X, Check, Download, FileText, User, Mail, Building, Award, Calendar, AlertCircle, ExternalLink } from 'lucide-react';

interface SubmissionDetailModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: SubmissionStatus, notes?: string) => Promise<void>;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  submission,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  if (!isOpen || !submission) return null;

  const [status, setStatus] = useState<SubmissionStatus>(submission.status || 'Recebida');
  const [notes, setNotes] = useState(submission.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateStatus(submission.id, status, notes);
      onClose();
    } catch (err) {
      console.error('Failed to update submission status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-blue-400" />
            <h3 id="submission-modal-title" className="text-base font-bold">
              Avaliação de Proposta de Publicação
            </h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-1 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Proponent Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <User size={16} className="text-blue-600" />
              <span>{submission.name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-slate-400" />
                <a href={`mailto:${submission.email}`} className="text-blue-600 hover:underline">
                  {submission.email}
                </a>
              </div>
              {submission.institution && (
                <div className="flex items-center gap-1.5">
                  <Building size={14} className="text-slate-400" />
                  <span>{submission.institution}</span>
                </div>
              )}
              {submission.orcid && (
                <div className="flex items-center gap-1.5">
                  <Award size={14} className="text-slate-400" />
                  <span>ORCID: {submission.orcid}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                <span>Recebido em: {new Date(submission.date).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Proposal Details */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Título da Obra Proposta</span>
            <h4 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
              {submission.title}
            </h4>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-blue-50 text-blue-800 font-semibold px-2.5 py-0.5 rounded">
                {submission.workType || 'Livro autoral'}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded">
                {submission.thematicArea || 'Ciências Humanas'}
              </span>
            </div>
          </div>

          {/* Proposal Abstract */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resumo da Proposta</span>
            <div className="mt-1 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-editorial leading-relaxed text-slate-700 whitespace-pre-wrap">
              {submission.abstract}
            </div>
          </div>

          {/* Submitted File */}
          {(submission.fileUrl || submission.driveWebViewLink) && (
            <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={24} className="text-blue-700 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-900 truncate">
                    {submission.fileName || 'Arquivo do Manuscrito / Proposta'}
                  </p>
                  <p className="text-[11px] text-blue-600">
                    {submission.driveWebViewLink ? 'Salvo no Google Drive (Pasta Submissões)' : 'Arquivo anexado pelo autor'}
                  </p>
                </div>
              </div>
              <a
                href={submission.driveWebViewLink || submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors shrink-0 shadow-xs"
              >
                {submission.driveWebViewLink ? <ExternalLink size={14} /> : <Download size={14} />}
                {submission.driveWebViewLink ? 'Abrir no Google Drive' : 'Baixar Proposta'}
              </a>
            </div>
          )}

          {/* Editorial Evaluation Controls */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Decisão do Comitê Editorial
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status da Avaliação
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SubmissionStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                >
                  <option value="Recebida">Recebida</option>
                  <option value="Em análise">Em análise</option>
                  <option value="Ajustes solicitados">Ajustes solicitados</option>
                  <option value="Aprovada">Aprovada para Publicação</option>
                  <option value="Rejeitada">Rejeitada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parecer / Observações Editoriais Internas
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Parecer dos revisores, pendências ou orientações para o autor..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check size={16} />
            {isSaving ? 'Salvando...' : 'Salvar Decisão Editorial'}
          </button>
        </div>

      </div>
    </div>
  );
};
