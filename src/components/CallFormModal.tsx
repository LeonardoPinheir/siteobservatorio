import React, { useState, useEffect } from 'react';
import { Call } from '../types';
import { X, Check, Megaphone, AlertCircle } from 'lucide-react';

interface CallFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (callData: Omit<Call, 'id'>, id?: string) => Promise<void>;
  initialCall?: Call | null;
}

export const CallFormModal: React.FC<CallFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCall,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<'Aberta' | 'Fechada'>('Aberta');
  const [link, setLink] = useState('/submissoes');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialCall) {
      setTitle(initialCall.title || '');
      setDescription(initialCall.description || '');
      setDeadline(initialCall.deadline || '');
      setStatus(initialCall.status || 'Aberta');
      setLink(initialCall.link || '/submissoes');
    } else {
      setTitle('');
      setDescription('');
      setDeadline(new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0]);
      setStatus('Aberta');
      setLink('/submissoes');
    }
    setErrorMessage('');
  }, [initialCall, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) {
      setErrorMessage('Título e prazo da chamada são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        deadline,
        status,
        link: link.trim(),
      }, initialCall?.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar chamada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone size={20} className="text-blue-400" />
            <h3 id="call-modal-title" className="text-base font-bold">
              {initialCall ? 'Editar Chamada' : 'Nova Chamada de Publicação'}
            </h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-1 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Título da Chamada <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Chamada para Capítulos: Livro Inteligência Artificial e Sociedade"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prazo Final de Submissão <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white font-medium"
              >
                <option value="Aberta">Aberta</option>
                <option value="Fechada">Fechada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição e Escopo
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ementa da chamada, cronograma, normas e eixos temáticos aceitos..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Link de Destino / Formulário
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/submissoes"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check size={15} />
              {isSubmitting ? 'Salvando...' : 'Salvar Chamada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
