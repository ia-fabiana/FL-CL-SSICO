import React, { useState } from 'react';
import { AudienceDay, AudiencePlatform, AudienceSubTask, AudienceTask, LaunchData } from '../types';
import { generateAudienceSubTaskContent } from '../services/gemini';

// ─── platform config ──────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<AudiencePlatform, { label: string; color: string; icon: string }> = {
  instagram: {
    label: 'Instagram',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    icon: '📸',
  },
  facebook: {
    label: 'Facebook',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: '👥',
  },
  youtube: {
    label: 'YouTube',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: '▶️',
  },
  geral: {
    label: 'Geral',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: '✔',
  },
};

const INSTAGRAM_HANDLE_RE = /^@[a-zA-Z0-9._]{1,30}$/;

const isValidAbsoluteUrl = (value?: string): boolean => {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidInstagramUrl = (value?: string): boolean => {
  if (!isValidAbsoluteUrl(value)) return false;
  return /instagram\.com/i.test(value || '');
};

// ─── sub-task row ─────────────────────────────────────────────────────────────

interface SubTaskRowProps {
  subTask: AudienceSubTask;
  launchData: LaunchData;
  onToggle: () => void;
  onContentChange: (draft: string) => void;
}

function SubTaskRow({ subTask, launchData, onToggle, onContentChange }: SubTaskRowProps) {
  const effectiveContentMode: 'text' | 'image' | 'both' =
    subTask.contentMode ?? (subTask.id === 'ig-04' ? 'both' : 'text');
  const hasContentUI = true;
  const [contentOpen, setContentOpen] = useState(false);
  const [draft, setDraft] = useState(subTask.contentDraft ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const missingFields: string[] = [];
  const formatErrors: string[] = [];

  if (subTask.id === 'ig-02') {
    if (!launchData.avatarName) missingFields.push('Nome da expert');
    if (!launchData.niche) missingFields.push('Nicho');
    if (!launchData.mainBenefit) missingFields.push('Promessa (ROMA)');
    if (!launchData.expertInstagramHandle) missingFields.push('Instagram (@)');
    if (!launchData.expertLinkInBio) missingFields.push('Link principal da bio');

    if (launchData.expertInstagramHandle && !INSTAGRAM_HANDLE_RE.test(launchData.expertInstagramHandle.trim())) {
      formatErrors.push('Instagram (@) inválido. Use formato @usuario.');
    }
    if (launchData.expertInstagramUrl && !isValidInstagramUrl(launchData.expertInstagramUrl)) {
      formatErrors.push('URL do Instagram inválida.');
    }
    if (launchData.expertLinkInBio && !isValidAbsoluteUrl(launchData.expertLinkInBio)) {
      formatErrors.push('Link principal da bio inválido.');
    }
  } else if (subTask.id === 'ig-04') {
    if (!launchData.avatarName) missingFields.push('Nome da expert');
    if (!launchData.avatarStory) missingFields.push('História da expert');
    if (!launchData.niche) missingFields.push('Nicho');
    if (!launchData.targetAudience) missingFields.push('Público-alvo');
    if (!launchData.mainBenefit) missingFields.push('Promessa (ROMA)');
    if (!launchData.productName) missingFields.push('Produto / método');
    if (!launchData.expertInstagramHandle) missingFields.push('Instagram (@)');

    if (launchData.expertInstagramHandle && !INSTAGRAM_HANDLE_RE.test(launchData.expertInstagramHandle.trim())) {
      formatErrors.push('Instagram (@) inválido. Use formato @usuario.');
    }
    if (launchData.expertInstagramUrl && !isValidInstagramUrl(launchData.expertInstagramUrl)) {
      formatErrors.push('URL do Instagram inválida.');
    }
  } else {
    if (!launchData.productName) missingFields.push('Nome do produto');
    if (!launchData.targetAudience) missingFields.push('Público-alvo');
    if (!launchData.mainBenefit) missingFields.push('Benefício principal (ROMA)');
  }

  if (effectiveContentMode === 'image' || effectiveContentMode === 'both') {
    if (!launchData.expertPhotoReferenceUrl) missingFields.push('Foto de referência da expert (URL/upload)');
    if (!launchData.expertLookGuide && !launchData.expertLookReferenceUrl) {
      missingFields.push('Roupa/visual: texto ou imagem de referência');
    }
    if (!launchData.expertEnvironmentGuide && !launchData.expertEnvironmentReferenceUrl) {
      missingFields.push('Ambiente/cenário: texto ou imagem de referência');
    }
  }

  const canGenerate = missingFields.length === 0;

  const handleGenerate = async () => {
    if (!canGenerate) {
      setGenError(`Preencha o briefing antes de gerar: ${missingFields.join(', ')}.`);
      return;
    }
    if (formatErrors.length > 0) {
      setGenError(`Corrija os campos inválidos antes de gerar: ${formatErrors.join(' ')}`);
      return;
    }
    setGenError(null);
    setIsGenerating(true);
    try {
      const result = await generateAudienceSubTaskContent(
        launchData,
        subTask.id,
        subTask.title,
        effectiveContentMode,
        subTask.imageSpec,
        subTask.expertPhotoRequired
      );
      setDraft(result);
      onContentChange(result);
    } catch (err) {
      setGenError('Erro ao gerar conteúdo. Verifique sua conexão e tente novamente.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <li className="rounded-xl px-2 py-2 transition hover:bg-slate-50">
      {/* row header */}
      <div
        className="flex cursor-pointer items-start gap-3"
        onClick={!hasContentUI ? onToggle : undefined}
      >
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onToggle();
          }}
          aria-label={subTask.done ? 'Desmarcar sub-tarefa' : 'Marcar sub-tarefa como feita'}
          className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-md border-2 transition ${
            subTask.done
              ? 'border-emerald-400 bg-emerald-400 text-white'
              : 'border-slate-300 bg-white hover:border-emerald-400'
          }`}
        >
          {subTask.done && (
            <svg viewBox="0 0 14 14" fill="none" className="mx-auto h-3 w-3" stroke="currentColor" strokeWidth={2.5}>
              <path d="M2 7l3.5 3.5L12 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex flex-1 min-w-0 items-start justify-between gap-2">
          <span className={`text-sm leading-relaxed ${
            subTask.done ? 'text-slate-400 line-through' : 'text-slate-700'
          }`}>
            {subTask.title}
          </span>

          <button
            type="button"
            onClick={e => { e.stopPropagation(); setContentOpen(v => !v); }}
            className="flex-shrink-0 rounded-full border border-pink-200 bg-pink-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-pink-600 hover:bg-pink-100"
          >
            {contentOpen ? 'ações ▲' : 'ações ▼'}
          </button>
        </div>
      </div>

      {/* content generation panel */}
      {hasContentUI && contentOpen && (
        <div
          className="mt-3 ml-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)] space-y-3"
          onClick={e => e.stopPropagation()}
        >
          {/* meta badges */}
          <div className="flex flex-wrap gap-2">
            {subTask.imageSpec && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-[11px] font-black text-pink-700">
                📐 {subTask.imageSpec.label} &nbsp;{subTask.imageSpec.ratio}&nbsp;—&nbsp;{subTask.imageSpec.width}×{subTask.imageSpec.height} px
              </span>
            )}
            {subTask.expertPhotoRequired && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
                🖼️ Foto da expert na composição
              </span>
            )}
            {effectiveContentMode === 'both' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-black text-sky-700">
                📝 Legenda + briefing de imagem
              </span>
            )}
            {effectiveContentMode === 'text' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-black text-sky-700">
                📝 Plano/Texto da tarefa
              </span>
            )}
            {effectiveContentMode === 'image' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black text-violet-700">
                🎨 Briefing de imagem
              </span>
            )}
          </div>

          {/* briefing validation warning */}
          {!canGenerate && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <span className="font-bold">Briefing incompleto:</span> preencha {missingFields.join(', ')} antes de gerar.
            </div>
          )}

          {formatErrors.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <span className="font-bold">Ajustes de formato:</span> {formatErrors.join(' ')}
            </div>
          )}

          {(subTask.id === 'ig-02' || subTask.id === 'ig-04') && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
              Esta tarefa usa os dados da coluna esquerda: expert, nicho, ROMA, público, história e redes sociais.
            </div>
          )}

          {/* generate button */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-[0.18em] transition ${
              isGenerating
                ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm hover:from-pink-600 hover:to-rose-600'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Gerando…
              </>
            ) : (
              '✨ Gerar conteúdo'
            )}
          </button>

          {/* error */}
          {genError && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {genError}
            </p>
          )}

          {/* draft textarea */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Rascunho gerado
            </label>
            <textarea
              rows={12}
              placeholder="O conteúdo gerado aparecerá aqui. Edite livremente antes de usar."
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={() => onContentChange(draft)}
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 leading-relaxed outline-none placeholder:text-slate-300 focus:border-pink-400 focus:bg-white transition"
            />
          </div>

          {/* copy button */}
          {draft && (
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
            >
              {copied ? '✓ Copiado!' : '📋 Copiar rascunho'}
            </button>
          )}

          {subTask.contentSavedAt && (
            <p className="text-[10px] text-slate-400">
              Salvo em {new Date(subTask.contentSavedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

// ─── task card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: AudienceTask;
  launchData: LaunchData;
  onToggleTask: () => void;
  onReopenTask: () => void;
  onToggleSubTask: (subTaskId: string) => void;
  onSubTaskContentChange: (subTaskId: string, draft: string) => void;
}

function TaskCard({ task, launchData, onToggleTask, onReopenTask, onToggleSubTask, onSubTaskContentChange }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const pc = PLATFORM_CONFIG[task.platform];
  const hasSubs = (task.subTasks?.length ?? 0) > 0;
  const subsDone = task.subTasks?.filter(s => s.done).length ?? 0;
  const subsTotal = task.subTasks?.length ?? 0;

  const groupedSubs = task.subTasks?.reduce<Record<AudiencePlatform, AudienceSubTask[]>>(
    (acc, sub) => {
      const platform = sub.id.startsWith('ig-')
        ? 'instagram'
        : sub.id.startsWith('fb-')
        ? 'facebook'
        : sub.id.startsWith('yt-')
        ? 'youtube'
        : 'geral';
      acc[platform] = [...(acc[platform] ?? []), sub];
      return acc;
    },
    { instagram: [], facebook: [], youtube: [], geral: [] }
  );

  return (
    <div
      onClick={onToggleTask}
      className={`rounded-2xl border-2 transition-all duration-200 ${
        task.done ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'
      } cursor-pointer p-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)]`}
    >
      {/* header row */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onToggleTask();
          }}
          aria-label={task.done ? 'Reabrir tarefa' : 'Marcar tarefa como concluída'}
          className={`mt-0.5 h-6 w-6 flex-shrink-0 rounded-lg border-2 transition ${
            task.done
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 bg-white hover:border-emerald-400'
          }`}
        >
          {task.done && (
            <svg viewBox="0 0 14 14" fill="none" className="mx-auto h-3 w-3" stroke="currentColor" strokeWidth={2.5}>
              <path d="M2 7l3.5 3.5L12 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm leading-snug font-semibold ${
                task.done ? 'text-slate-400 line-through' : 'text-slate-900'
              }`}
            >
              {task.title}
            </span>
            {task.platform !== 'geral' && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${pc.color}`}>
                {pc.icon} {pc.label}
              </span>
            )}
          </div>

          {hasSubs && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: subsTotal > 0 ? `${(subsDone / subsTotal) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                {subsDone}/{subsTotal}
              </span>
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  setExpanded(v => !v);
                }}
                className="text-[10px] font-black uppercase tracking-[0.15em] text-sky-600 hover:text-sky-800"
              >
                {expanded ? 'ocultar ▲' : 'expandir ▼'}
              </button>
            </div>
          )}

          {task.notes && (
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">{task.notes}</p>
          )}

          {task.done && (
            <div className="mt-2">
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  onReopenTask();
                }}
                className="rounded-full border border-rose-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-600 hover:border-rose-300 hover:bg-rose-50"
              >
                Desmarcar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* sub-tasks */}
      {hasSubs && expanded && (
        <div className="mt-4 space-y-4 pl-9">
          {((['instagram', 'facebook', 'youtube', 'geral'] as AudiencePlatform[]).filter(
            p => (groupedSubs?.[p]?.length ?? 0) > 0
          )).map(platform => {
            const cfg = PLATFORM_CONFIG[platform];
            const subs = groupedSubs?.[platform] ?? [];
            return (
              <div key={platform}>
                {platform !== 'geral' && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                )}
                <ul className="divide-y divide-slate-100">
                  {subs.map(sub => (
                    <SubTaskRow
                      key={sub.id}
                      subTask={sub}
                      launchData={launchData}
                      onToggle={() => onToggleSubTask(sub.id)}
                      onContentChange={draft => onSubTaskContentChange(sub.id, draft)}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── day group ────────────────────────────────────────────────────────────────

interface DayGroupProps {
  day: AudienceDay;
  launchData: LaunchData;
  onToggleTask: (taskId: string) => void;
  onReopenTask: (taskId: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onSubTaskContentChange: (taskId: string, subTaskId: string, draft: string) => void;
}

function DayGroup({ day, launchData, onToggleTask, onReopenTask, onToggleSubTask, onSubTaskContentChange }: DayGroupProps) {
  const doneTasks = day.tasks.filter(t => t.done).length;
  const totalTasks = day.tasks.length;
  const allDone = doneTasks === totalTasks && totalTasks > 0;

  const formattedDate = day.date
    ? (() => {
        const d = new Date(`${day.date}T00:00:00`);
        if (Number.isNaN(d.getTime())) return day.date;
        return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
      })()
    : null;

  return (
    <div className="space-y-3">
      {/* day header */}
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 flex-shrink-0 rounded-xl flex items-center justify-center text-sm font-black ${allDone ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
          {allDone ? '✓' : doneTasks}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black text-slate-900 leading-tight">
            {day.label}
            {formattedDate && (
              <span className="ml-2 text-xs font-semibold text-slate-400 capitalize">{formattedDate}</span>
            )}
          </p>
          <p className="text-xs text-slate-400">{doneTasks} de {totalTasks} tarefas concluídas</p>
        </div>
        <div className="h-2 w-28 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-300"
            style={{ width: totalTasks > 0 ? `${(doneTasks / totalTasks) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* tasks */}
      <div className="space-y-2 pl-11">
        {day.tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            launchData={launchData}
            onToggleTask={() => onToggleTask(task.id)}
            onReopenTask={() => onReopenTask(task.id)}
            onToggleSubTask={subId => onToggleSubTask(task.id, subId)}
            onSubTaskContentChange={(subId, draft) => onSubTaskContentChange(task.id, subId, draft)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── main panel ──────────────────────────────────────────────────────────────

interface AudienceCreationPanelProps {
  days: AudienceDay[];
  launchData: LaunchData;
  onChange: (days: AudienceDay[]) => void;
}

export default function AudienceCreationPanel({ days, launchData, onChange }: AudienceCreationPanelProps) {
  const totalTasks = days.flatMap(d => d.tasks).length;
  const doneTasks = days.flatMap(d => d.tasks).filter(t => t.done).length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const handleToggleTask = (dayId: string, taskId: string) => {
    onChange(
      days.map(day => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          tasks: day.tasks.map(task => {
            if (task.id !== taskId) return task;
            const nowDone = !task.done;
            return {
              ...task,
              done: nowDone,
              doneAt: nowDone ? new Date().toISOString() : undefined,
            };
          }),
        };
      })
    );
  };

  const handleReopenTask = (dayId: string, taskId: string) => {
    onChange(
      days.map(day => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          tasks: day.tasks.map(task => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              done: false,
              doneAt: undefined,
            };
          }),
        };
      })
    );
  };

  const handleToggleSubTask = (dayId: string, taskId: string, subTaskId: string) => {
    onChange(
      days.map(day => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          tasks: day.tasks.map(task => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              subTasks: (task.subTasks ?? []).map(sub => {
                if (sub.id !== subTaskId) return sub;
                const nowDone = !sub.done;
                return {
                  ...sub,
                  done: nowDone,
                  doneAt: nowDone ? new Date().toISOString() : undefined,
                };
              }),
            };
          }),
        };
      })
    );
  };

  const handleSubTaskContentChange = (dayId: string, taskId: string, subTaskId: string, draft: string) => {
    onChange(
      days.map(day => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          tasks: day.tasks.map(task => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              subTasks: (task.subTasks ?? []).map(sub => {
                if (sub.id !== subTaskId) return sub;
                return {
                  ...sub,
                  contentDraft: draft,
                  contentSavedAt: new Date().toISOString(),
                };
              }),
            };
          }),
        };
      })
    );
  };

  return (
    <div className="space-y-8">
      {/* summary bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Progresso geral</p>
          <p className="mt-0.5 text-2xl font-black text-slate-900">
            {doneTasks}
            <span className="text-base font-semibold text-slate-400"> / {totalTasks} tarefas</span>
          </p>
        </div>
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm font-black text-slate-700 w-10 text-right">{pct}%</span>
        </div>
      </div>

      {/* day groups */}
      {days.map(day => (
        <DayGroup
          key={day.id}
          day={day}
          launchData={launchData}
          onToggleTask={taskId => handleToggleTask(day.id, taskId)}
          onReopenTask={taskId => handleReopenTask(day.id, taskId)}
          onToggleSubTask={(taskId, subId) => handleToggleSubTask(day.id, taskId, subId)}
          onSubTaskContentChange={(taskId, subId, draft) => handleSubTaskContentChange(day.id, taskId, subId, draft)}
        />
      ))}
    </div>
  );
}
