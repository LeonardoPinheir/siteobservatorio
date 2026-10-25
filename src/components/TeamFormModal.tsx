import React, { useState, useEffect } from 'react';
import { TeamMember } from '../types';
import { X, Check, Users, AlertCircle } from 'lucide-react';

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Omit<TeamMember, 'id'>, id?: string) => Promise<void>;
  initialMember?: TeamMember | null;
}

export const TeamFormModal: React.FC<TeamFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMember,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [institution, setInstitution] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialMember) {
      setName(initialMember.name || '');
      setRole(initialMember.role || '');
      setInstitution(initialMember.institution || '');
      setOrder(initialMember.order || 1);
    } else {
      setName('');
      setRole('Membro do Conselho Editorial');
      setInstitution('Universidade Federal do Tocantins (UFT)');
      setOrder(1);
    }
    setErrorMessage('');
  }, [initialMember, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      setErrorMessage('Nome e função são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        role: role.trim(),
        institution: institution.trim(),
        order: Number(order) || 1,
      }, initialMember?.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar membro da equipe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            <h3 id="team-modal-title" className="text-base font-bold">
              {initialMember ? 'Editar Membro da Equipe' : 'Adicionar Membro Editorial'}
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
              Nome Completo com Titulação <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Prof. Dr. Leonardo Pinheiro"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Função Editorial <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex.: Editor-Chefe, Conselho Editorial, Comitê Científico"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Instituição de Vínculo
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Ex.: Universidade Federal do Tocantins (UFT)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
              {isSubmitting ? 'Salvando...' : 'Salvar Membro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
