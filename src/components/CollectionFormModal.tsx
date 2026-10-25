import React, { useState, useEffect } from 'react';
import { EditorialCollection } from '../types';
import { X, Check, Layers, AlertCircle } from 'lucide-react';

interface CollectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<EditorialCollection, 'id'>, id?: string) => Promise<void>;
  initialCollection?: EditorialCollection | null;
}

export const CollectionFormModal: React.FC<CollectionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCollection,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialCollection) {
      setTitle(initialCollection.title || '');
      setDescription(initialCollection.description || '');
      setOrder(initialCollection.order || 1);
    } else {
      setTitle('');
      setDescription('');
      setOrder(1);
    }
    setErrorMessage('');
  }, [initialCollection, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('O título da coleção é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      await onSave({
        title: title.trim(),
        description: description.trim(),
        slug,
        order: Number(order) || 1,
      }, initialCollection?.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar coleção editorial.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-blue-400" />
            <h3 id="collection-modal-title" className="text-base font-bold">
              {initialCollection ? 'Editar Coleção Editorial' : 'Nova Coleção Editorial'}
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
              Nome da Coleção <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Comunicação e Sociedade"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição do Escopo da Coleção
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Obras dedicadas aos estudos..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ordem de Exibição
            </label>
            <input
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
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
              {isSubmitting ? 'Salvando...' : 'Salvar Coleção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
