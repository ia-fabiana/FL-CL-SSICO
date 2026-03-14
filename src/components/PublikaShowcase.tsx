import React from 'react';
import { PUBLIKA_CATEGORY_COPY, PublikaCategory, PublikaModule, PublikaSummary } from '../publika';

const CATEGORY_ORDER: PublikaCategory[] = ['diagnostic', 'planning', 'content', 'performance'];

interface Props {
  summary: PublikaSummary;
  modules: PublikaModule[];
}

export function PublikaShowcase({ summary, modules }: Props) {
  return (
    <section className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-500/80">Solução exclusiva</p>
          <h2 className="text-3xl font-black text-slate-900">Publika.AI · Painel de Crescimento</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">{summary.description}</p>
        </div>
        <span className="rounded-full border border-teal-200 bg-white px-4 py-1.5 text-xs font-semibold text-teal-700">{summary.subtitle}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-cyan-600 to-teal-500 text-white p-8 shadow-xl">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_60%)]" aria-hidden />
          <div className="relative space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">{summary.title}</p>
              <h3 className="text-2xl font-black mt-2">{summary.tagline}</h3>
              <p className="text-sm text-white/80 mt-3 max-w-sm">{summary.description}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="rounded-2xl bg-white/15 px-5 py-4 border border-white/20">
                <p className="text-xs uppercase tracking-[0.4em] text-white/70">{summary.creditPack.model}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-black">{summary.creditPack.amount}</span>
                  <span className="text-sm text-white/70">{summary.creditPack.label}</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-white/90">
                {summary.highlights.map(highlight => (
                  <li key={highlight} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-teal-100 bg-white/90 p-8 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-500">Fluxo end-to-end</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Diagnóstico → Criação → Escala</h3>
          <p className="text-sm text-slate-600 mt-4">
            "Este projeto foi desenhado para profissionais da beleza criarem autoridade, campanhas e previsibilidade de agenda sem depender de dezenas de ferramentas separadas. Comece no diagnóstico, evolua para criação e escale com os módulos de operação." — Conteúdo oficial do app Publika.AI.
          </p>
        </div>
      </div>

      {CATEGORY_ORDER.map(category => {
        const categoryModules = modules.filter(module => module.category === category);
        const copy = PUBLIKA_CATEGORY_COPY[category];

        return (
          <div key={category} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-500/80">Painel Publika</p>
                <h3 className="text-2xl font-black text-slate-900">{copy.title}</h3>
                <p className="text-sm text-slate-500 max-w-2xl">{copy.description}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categoryModules.map(module => (
                <div
                  key={module.code}
                  className={`rounded-2xl border-2 p-5 shadow-sm transition ${
                    module.status === 'available'
                      ? 'border-teal-100 bg-white'
                      : 'border-amber-100 bg-amber-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.4em]">
                    <span className="text-slate-400">{module.code}</span>
                    <span
                      className={`${
                        module.status === 'available' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {module.status === 'available' ? 'Disponível' : 'Em breve'}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mt-3">{module.name}</h4>
                  <p className="text-sm text-slate-600 mt-2">{module.description}</p>
                  <p className="text-xs text-slate-500 mt-2 italic">{module.benefit}</p>
                  <div className="mt-4 flex items-center justify-between text-sm font-semibold">
                    <span className="text-teal-600">
                      {module.credits === 1
                        ? '1 crédito'
                        : `${module.credits} créditos`}
                    </span>
                    <span
                      className={`${
                        module.status === 'available' ? 'text-slate-700' : 'text-amber-700'
                      } text-xs font-bold uppercase tracking-wider`}
                    >
                      {module.actionLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
