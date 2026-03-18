import React, { useEffect, useMemo, useState } from 'react';
import { generateLeadCaptureTaskContent } from '../services/gemini';
import { LaunchData, LeadCapturePrepDay, LeadCapturePrepTask } from '../types';

interface LeadCapturePreparationPanelProps {
  days: LeadCapturePrepDay[];
  launchData: LaunchData;
  onChange: (days: LeadCapturePrepDay[]) => void;
}

interface TaskRowProps {
  dayLabel: string;
  blockTitle: string;
  task: LeadCapturePrepTask;
  launchData: LaunchData;
  onToggle: () => void;
  onDraftChange: (draft: string) => void;
}

function TaskRow({ dayLabel, blockTitle, task, launchData, onToggle, onDraftChange }: TaskRowProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [draft, setDraft] = useState(task.contentDraft ?? '');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(task.contentDraft ?? '');
  }, [task.contentDraft]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const generated = await generateLeadCaptureTaskContent(launchData, dayLabel, blockTitle, task);
      setDraft(generated);
      onDraftChange(generated);
    } catch (generationError) {
      console.error('Erro ao gerar plano da tarefa de captação', generationError);
      setError('Não foi possível gerar o plano desta tarefa agora. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!draft.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      console.error('Erro ao copiar plano da tarefa', copyError);
      setError('Não foi possível copiar o texto automaticamente.');
    }
  };

  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-sm transition ${task.done ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={task.done ? 'Desmarcar tarefa' : 'Marcar tarefa como concluída'}
          className={`mt-0.5 h-6 w-6 flex-shrink-0 rounded-lg border-2 transition ${
            task.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-emerald-400'
          }`}
        >
          {task.done && (
            <svg viewBox="0 0 14 14" fill="none" className="mx-auto h-3 w-3" stroke="currentColor" strokeWidth={2.5}>
              <path d="M2 7l3.5 3.5L12 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className={`text-sm font-semibold leading-relaxed ${task.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                {task.title}
              </p>
              {task.notes && <p className="mt-1 text-xs text-slate-500">{task.notes}</p>}
            </div>

            <button
              type="button"
              onClick={() => setActionsOpen(current => !current)}
              className="inline-flex flex-shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100"
            >
              {actionsOpen ? 'Fechar ações' : 'Ações'}
            </button>
          </div>

          {actionsOpen && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <div className="rounded-2xl border border-indigo-100 bg-white px-3 py-3 text-xs text-slate-600">
                <p className="font-black uppercase tracking-[0.2em] text-indigo-500">Entrega da tarefa</p>
                <p className="mt-2">
                  Gere um plano prático para executar este item com base no briefing, na ROMA e no contexto da captação.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.22em] transition ${
                  isGenerating ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isGenerating ? 'Gerando plano...' : 'Gerar plano da tarefa'}
              </button>

              {error && (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                  {error}
                </p>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Plano de execução</label>
                <textarea
                  rows={10}
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onBlur={() => onDraftChange(draft)}
                  placeholder="O plano gerado para esta tarefa aparece aqui. Você pode editar livremente."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!draft.trim()}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  {copied ? 'Copiado' : 'Copiar plano'}
                </button>
                {task.contentSavedAt && (
                  <span className="text-[10px] text-slate-400">
                    Atualizado em {new Date(task.contentSavedAt).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function countDayTasks(day: LeadCapturePrepDay) {
  return day.blocks.flatMap(block => block.tasks);
}

export default function LeadCapturePreparationPanel({ days, launchData, onChange }: LeadCapturePreparationPanelProps) {
  const allTasks = useMemo(() => days.flatMap(countDayTasks), [days]);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(task => task.done).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const updateDays = (updater: (current: LeadCapturePrepDay[]) => LeadCapturePrepDay[]) => {
    onChange(updater(days));
  };

  const handleToggleTask = (dayId: string, blockId: string, taskId: string) => {
    updateDays(current =>
      current.map(day => {
        if (day.id !== dayId) {
          return day;
        }

        return {
          ...day,
          blocks: day.blocks.map(block => {
            if (block.id !== blockId) {
              return block;
            }

            return {
              ...block,
              tasks: block.tasks.map(task => {
                if (task.id !== taskId) {
                  return task;
                }

                const nextDone = !task.done;
                return {
                  ...task,
                  done: nextDone,
                  doneAt: nextDone ? new Date().toISOString() : undefined,
                };
              }),
            };
          }),
        };
      })
    );
  };

  const handleDraftChange = (dayId: string, blockId: string, taskId: string, draft: string) => {
    updateDays(current =>
      current.map(day => {
        if (day.id !== dayId) {
          return day;
        }

        return {
          ...day,
          blocks: day.blocks.map(block => {
            if (block.id !== blockId) {
              return block;
            }

            return {
              ...block,
              tasks: block.tasks.map(task =>
                task.id === taskId
                  ? {
                      ...task,
                      contentDraft: draft,
                      contentSavedAt: new Date().toISOString(),
                    }
                  : task
              ),
            };
          }),
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Progresso da semana</p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {doneTasks}
              <span className="text-base font-semibold text-slate-400"> / {totalTasks} tarefas</span>
            </p>
          </div>

          <div className="flex min-w-[220px] items-center gap-3">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-10 text-right text-sm font-black text-slate-700">{progress}%</span>
          </div>
        </div>
      </div>

      {days.map(day => {
        const dayTasks = countDayTasks(day);
        const dayDone = dayTasks.filter(task => task.done).length;
        const formattedDate = day.date
          ? new Date(`${day.date}T00:00:00`).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
            })
          : null;

        return (
          <section key={day.id} className="space-y-4 rounded-[28px] border-2 border-slate-200 bg-white/95 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-indigo-500">{day.label}</p>
                {formattedDate && (
                  <p className="mt-1 text-xs capitalize text-slate-400">
                    {formattedDate}
                  </p>
                )}
              </div>
              <div className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                {dayDone}/{dayTasks.length} concluídas
              </div>
            </div>

            <div className="space-y-4">
              {day.blocks.map(block => (
                <div key={block.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 border-b border-slate-200 pb-3">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">{block.title}</p>
                    {block.description && (
                      <p className="mt-2 text-sm text-slate-600">{block.description}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {block.tasks.map(task => (
                      <TaskRow
                        key={task.id}
                        dayLabel={day.label}
                        blockTitle={block.title}
                        task={task}
                        launchData={launchData}
                        onToggle={() => handleToggleTask(day.id, block.id, task.id)}
                        onDraftChange={draft => handleDraftChange(day.id, block.id, task.id, draft)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
