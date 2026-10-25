import React from 'react';
import { Link } from 'react-router-dom';
import { Call } from '../types';
import { Calendar, Megaphone, ArrowRight } from 'lucide-react';

interface CallCardProps {
  call: Call;
}

export const CallCard: React.FC<CallCardProps> = ({ call }) => {
  const isClosed = call.status === 'Fechada';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col h-full group">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
            isClosed
              ? 'bg-slate-100 text-slate-600'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {call.status}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Calendar size={14} className="text-slate-400" />
          <span>Prazo: {new Date(call.deadline).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors leading-snug mb-2">
        {call.title}
      </h3>

      <p className="text-xs text-slate-600 font-editorial leading-relaxed line-clamp-3 mb-6 flex-grow">
        {call.description}
      </p>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          {isClosed ? 'Chamada encerrada' : 'Submissões abertas'}
        </span>
        <Link
          to={call.link || '/submissoes'}
          className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${
            isClosed
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-blue-700 hover:text-blue-900 group-hover:translate-x-0.5 transition-transform'
          }`}
        >
          {isClosed ? 'Ver edital' : 'Submeter proposta'}
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};
