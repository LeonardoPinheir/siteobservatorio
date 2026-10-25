import React, { useState, useEffect } from 'react';
import { Author, ContributorRole } from '../types';
import { X, Check, User, AlertCircle } from 'lucide-react';
import { isValidOrcid } from '../utils/validators';

interface AuthorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (authorData: Omit<Author, 'id'>, id?: string) => Promise<void>;
  initialAuthor?: Author | null;
}

export const AuthorFormModal: React.FC<AuthorFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAuthor,
}) => {
  const [name, setName] = useState('');
  const [defaultRole, setDefaultRole] = useState<ContributorRole>('Autor');
  const [orcid, setOrcid] = useState('');
  const [institution, setInstitution] = useState('');
  const [institutionRor, setInstitutionRor] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialAuthor) {
      setName(initialAuthor.name || '');
      setDefaultRole(initialAuthor.defaultRole || 'Autor');
      setOrcid(initialAuthor.orcid || '');
      setInstitution(initialAuthor.institution || '');
      setInstitutionRor(initialAuthor.institutionRor || '');
      setCountry(initialAuthor.country || 'Brasil');
      setBio(initialAuthor.bio || '');
    } else {
      setName('');
      setDefaultRole('Autor');
      setOrcid('');
      setInstitution('Universidade Federal do Tocantins (UFT)');
      setInstitutionRor('https://ror.org/03x3q0542');
      setCountry('Brasil');
      setBio('');
    }
    setErrorMessage('');
  }, [initialAuthor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('O nome do autor/pesquisador é obrigatório.');
      return;
    }
    if (orcid && !isValidOrcid(orcid)) {
      setErrorMessage('Formato de ORCID inválido. Use 0000-0000-0000-0000 ou link https://orcid.org/...');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        defaultRole,
        orcid: orcid.trim(),
        institution: institution.trim(),
        institutionRor: institutionRor.trim(),
        country: country.trim(),
        bio: bio.trim(),
      }, initialAuthor?.id);

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar autor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="author-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={20} className="text-blue-400" />
            <h3 id="author-modal-title" className="text-base font-bold">
              {initialAuthor ? 'Editar Autor/Pesquisador' : 'Cadastrar Autor/Pesquisador'}
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
              Nome Completo <span className="text-rose-600">*</span>
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
              ORCID iD
            </label>
            <input
              type="text"
              value={orcid}
              onChange={(e) => setOrcid(e.target.value)}
              placeholder="0000-0002-1825-0097"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <span>Link ROR da Instituição</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded font-mono">ror.org/...</span>
              </label>
              <input
                type="url"
                value={institutionRor}
                onChange={(e) => setInstitutionRor(e.target.value)}
                placeholder="https://ror.org/03x3q0542"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                País
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Biografia Sucinta / Notas
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Mini biografia acadêmica (titulação, áreas de pesquisa, grupos do CNPq)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed"
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
              {isSubmitting ? 'Salvando...' : 'Salvar Autor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
