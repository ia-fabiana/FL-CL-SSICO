import React, { useState } from 'react';
import { AudienceDay, AudiencePlatform, AudienceSubTask, AudienceTask } from '../types';

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

// ─── sub-task row ─────────────────────────────────────────────────────────────

interface SubTaskRowProps {
  subTask: AudienceSubTask;
  onToggle: () => void;
}

function SubTaskRow({ subTask, onToggle }: SubTaskRowProps) {
  return (
    <li
      className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50"
      onClick={onToggle}
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
      <span className={`text-sm leading-relaxed ${subTask.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
        {subTask.title}
      </span>
    </li>
  );
}

// ─── task card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: AudienceTask;
  onToggleTask: () => void;
  onToggleSubTask: (subTaskId: string) => void;
}

function TaskCard({ task, onToggleTask, onToggleSubTask }: TaskCardProps) {
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
                      onToggle={() => onToggleSubTask(sub.id)}
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
  onToggleTask: (taskId: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
}

function DayGroup({ day, onToggleTask, onToggleSubTask }: DayGroupProps) {
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
            onToggleTask={() => onToggleTask(task.id)}
            onToggleSubTask={subId => onToggleSubTask(task.id, subId)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── main panel ──────────────────────────────────────────────────────────────

interface AudienceCreationPanelProps {
  days: AudienceDay[];
  onChange: (days: AudienceDay[]) => void;
}

export default function AudienceCreationPanel({ days, onChange }: AudienceCreationPanelProps) {
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
          onToggleTask={taskId => handleToggleTask(day.id, taskId)}
          onToggleSubTask={(taskId, subId) => handleToggleSubTask(day.id, taskId, subId)}
        />
      ))}
    </div>
  );
}
