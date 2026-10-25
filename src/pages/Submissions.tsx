import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FileText, Download, Upload, CheckCircle2, AlertCircle, ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';
import { addSubmission, SubmissionTemplate } from '../lib/store';
import { getSubmissionTemplate } from '../lib/catalog';
import { isValidOrcid } from '../utils/validators';

export function Submissions() {
  const [template, setTemplate] = useState<SubmissionTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    orcid: '',
    title: '',
    workType: 'Livro autoral',
    thematicArea: 'Ciências Humanas e Sociais',
    abstract: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [protocolNumber, setProtocolNumber] = useState('');

  useEffect(() => {
    getSubmissionTemplate().then(setTemplate).catch(console.warn);
    document.title = 'Submissões de Obras | Observatório Edições';
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (allowed.includes(selected.type) || selected.name.endsWith('.doc') || selected.name.endsWith('.docx') || selected.name.endsWith('.pdf')) {
        setFile(selected);
        setErrorMessage('');
      } else {
        setErrorMessage('Formato de arquivo inválido. Por favor, envie arquivos em formato PDF, Word (.doc ou .docx).');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.title.trim() || !formData.abstract.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (formData.orcid && !isValidOrcid(formData.orcid)) {
      setErrorMessage('O ORCID informado está em formato inválido. Use 0000-0000-0000-0000 ou link.');
      return;
    }

    if (!agreementAccepted) {
      setErrorMessage('Você deve concordar com as diretrizes editoriais e política de privacidade para submeter.');
      return;
    }

    if (!file) {
      setErrorMessage('Por favor, anexe o arquivo com a proposta detalhada ou texto do manuscrito.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addSubmission({
        ...formData,
        file,
        fileName: file.name,
        agreementAccepted,
      });

      const protocol = `OBS-${new Date().getFullYear()}-${res.id.slice(0, 6).toUpperCase()}`;
      setProtocolNumber(protocol);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        institution: '',
        orcid: '',
        title: '',
        workType: 'Livro autoral',
        thematicArea: 'Ciências Humanas e Sociais',
        abstract: '',
      });
      setFile(null);
      setAgreementAccepted(false);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMessage(err.message || 'Falha ao enviar submissão. Tente novamente mais tarde.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-8 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-md uppercase tracking-wider">
              Chamadas e Fluxo Contínuo
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2 font-classical">
              Submissão de Propostas de Livros e Capítulos
            </h1>
            <p className="text-sm text-slate-600 mt-2 font-editorial">
              Envie sua proposta de publicação acadêmica para avaliação pelo Conselho Editorial do Observatório Edições. As obras aprovadas são editadas e publicadas em acesso aberto.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Editorial Guidelines & Template Download (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Guidelines Box */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-700" />
                  Diretrizes para Autores
                </h3>
                <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed font-editorial">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>Obras inéditas ou com expressa autorização para edição acadêmica.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>Revisão por pares cega (double-blind peer review) para livros e coletâneas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>Atribuição de ISBN oficial e registro permanente de DOI para todas as publicações.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>Compromisso integral com a Ciência Aberta e licenças Creative Commons.</span>
                  </li>
                </ul>
              </div>

              {/* Template Download Card */}
              <div className="bg-blue-50/70 rounded-2xl p-6 border border-blue-200/80 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <FileText size={18} className="text-blue-700" />
                  <span>Modelo / Template Editorial</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed font-editorial">
                  Utilize o modelo padronizado do Observatório Edições para estruturação do seu manuscrito ou sumário analítico.
                </p>
                <a
                  href={template?.fileUrl || '/template-modelo.txt'}
                  download="Modelo_Submissao_Observatorio_Edicoes.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs w-full justify-center"
                >
                  <Download size={14} />
                  Baixar Modelo de Submissão
                </a>
              </div>

            </div>

            {/* Right: Submission Form (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
              
              {submitStatus === 'success' ? (
                <div className="p-8 text-center space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Proposta Enviada com Sucesso!</h3>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block">
                    <span className="text-xs text-slate-500 block">Número de Protocolo Editorial:</span>
                    <span className="font-mono font-bold text-sm text-blue-700">{protocolNumber}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-editorial">
                    Sua proposta foi registrada em nossa base interna e será analisada pela equipe do Observatório Edições. Você receberá um e-mail com as próximas etapas.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitStatus('idle')}
                    className="mt-4 px-6 py-2.5 bg-slate-900 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                  >
                    Submeter Outra Proposta
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-lg font-bold text-slate-900">Formulário de Submissão</h2>
                    <p className="text-xs text-slate-500">Preencha os dados do proponente e anexe a proposta.</p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nome Completo do Proponente <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex.: Prof. Dr. Silva"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail de Contato <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="autor@universidade.edu.br"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Instituição de Vínculo
                      </label>
                      <input
                        type="text"
                        value={formData.institution}
                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                        placeholder="Ex.: Universidade Federal do Tocantins (UFT)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ORCID iD
                      </label>
                      <input
                        type="text"
                        value={formData.orcid}
                        onChange={(e) => setFormData({ ...formData, orcid: e.target.value })}
                        placeholder="0000-0002-1825-0097"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Título Provisório da Obra <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex.: Narrativas Amazônicas e Comunicação Comunitária"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tipo de Obra
                      </label>
                      <select
                        value={formData.workType}
                        onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        <option value="Livro autoral">Livro autoral</option>
                        <option value="Coletânea / Organizado">Coletânea / Livro Organizado</option>
                        <option value="E-book">E-book</option>
                        <option value="Relatório de Pesquisa">Relatório Institucional de Pesquisa</option>
                        <option value="Dossiê Temático">Dossiê Temático</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Área Temática
                      </label>
                      <input
                        type="text"
                        value={formData.thematicArea}
                        onChange={(e) => setFormData({ ...formData, thematicArea: e.target.value })}
                        placeholder="Ex.: Comunicação e Cultura"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Resumo da Proposta (Objetivos, relevância e estrutura) <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.abstract}
                      onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                      placeholder="Apresente um resumo analítico detalhando os objetivos, o marco teórico-metodológico e a relevância científica ou cultural da obra proposta..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-editorial leading-relaxed"
                    />
                  </div>

                  {/* File Upload Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Arquivo do Manuscrito / Proposta Completa (PDF, DOC ou DOCX) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {file && (
                      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        Arquivo selecionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  {/* Agreement Checkbox */}
                  <div className="flex items-start gap-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="agreement"
                      checked={agreementAccepted}
                      onChange={(e) => setAgreementAccepted(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 mt-1"
                    />
                    <label htmlFor="agreement" className="text-xs text-slate-600 font-editorial leading-normal cursor-pointer">
                      Declaro que a proposta submetida é original, atende às diretrizes éticas da pesquisa científica e estou ciente da política editorial e de acesso aberto do <strong>Observatório Edições</strong>.
                    </label>
                  </div>

                  <div className="pt-4 text-right">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                      <Upload size={16} />
                      {isSubmitting ? 'Enviando Proposta...' : 'Enviar Proposta de Publicação'}
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
