import React from 'react';
import { PublikaModule, PublikaSummary } from '../publika';

interface Props {
  summary: PublikaSummary;
  modules: PublikaModule[];
  onSummaryChange: (field: keyof PublikaSummary, value: string) => void;
  onCreditPackChange: (field: keyof PublikaSummary['creditPack'], value: string | number) => void;
  onHighlightChange: (index: number, value: string) => void;
  onModuleChange: (code: string, field: keyof PublikaModule, value: string) => void;
}

export function PublikaEditor({ summary, modules, onSummaryChange, onCreditPackChange, onHighlightChange, onModuleChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-500/80">Solução</p>
        <h3 className="text-2xl font-black text-slate-900">Publika.AI · Configuração rápida</h3>
        <p className="text-sm text-slate-500 mt-1">Personalize os textos que serão usados nas referências e prompts da sua solução proprietária.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Título principal</span>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={summary.title}
            onChange={event => onSummaryChange('title', event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subtítulo</span>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={summary.subtitle}
            onChange={event => onSummaryChange('subtitle', event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tagline</span>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={summary.tagline}
            onChange={event => onSummaryChange('tagline', event.target.value)}
          />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Descrição</span>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            rows={3}
            value={summary.description}
            onChange={event => onSummaryChange('description', event.target.value)}
          />
        </label>

        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nome do pack de créditos</span>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={summary.creditPack.label}
            onChange={event => onCreditPackChange('label', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modelo de consumo</span>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={summary.creditPack.model}
            onChange={event => onCreditPackChange('model', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total de créditos ativos</span>
          <input
            type="number"
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={summary.creditPack.amount}
            onChange={event => onCreditPackChange('amount', Number(event.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Destaques (3 bullets)</span>
        <div className="grid gap-3 md:grid-cols-3">
          {summary.highlights.map((highlight, index) => (
            <textarea
              key={index}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              rows={2}
              value={highlight}
              onChange={event => onHighlightChange(index, event.target.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-500/80">Módulos</p>
          <h4 className="text-xl font-bold text-slate-900">Edite descrição e benefício de cada módulo</h4>
        </div>
        <div className="space-y-4">
          {modules.map(module => (
            <div key={module.code} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">{module.code}</span>
                <span className="text-xs font-bold uppercase tracking-[0.4em] text-teal-500">{module.category}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nome</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={module.name}
                    onChange={event => onModuleChange(module.code, 'name', event.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Botão / Ação</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={module.actionLabel}
                    onChange={event => onModuleChange(module.code, 'actionLabel', event.target.value)}
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Descrição</span>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    rows={2}
                    value={module.description}
                    onChange={event => onModuleChange(module.code, 'description', event.target.value)}
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Benefício</span>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    rows={2}
                    value={module.benefit}
                    onChange={event => onModuleChange(module.code, 'benefit', event.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Créditos</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={module.credits}
                    onChange={event => onModuleChange(module.code, 'credits', event.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={module.status}
                    onChange={event => onModuleChange(module.code, 'status', event.target.value)}
                  >
                    <option value="available">Disponível</option>
                    <option value="soon">Em breve</option>
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
