import { useState } from "react";
import type { ChecklistBlock, ChecklistBlockId, ChecklistData } from "../types";

interface ChecklistPanelProps {
  checklist: ChecklistData;
  onUpdateBlock: (blockId: ChecklistBlockId, status: ChecklistBlock["status"]) => Promise<void>;
}

interface PendingState {
  blockId?: ChecklistBlockId;
}

export function ChecklistPanel({ checklist, onUpdateBlock }: ChecklistPanelProps) {
  const [pending, setPending] = useState<PendingState>({});
  const [error, setError] = useState<string | null>(null);

  const handleBlockToggle = async (block: ChecklistBlock) => {
    const nextStatus = block.status === "approved" ? "pending" : "approved";
    try {
      setPending({ blockId: block.id });
      setError(null);
      await onUpdateBlock(block.id, nextStatus);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending({});
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-indigo-500/70">Comando Mestre</p>
          <h2 className="text-xl font-semibold text-slate-900">Checklist operacional</h2>
        </div>
        {error && <span className="text-sm text-rose-500">{error}</span>}
      </div>

      <p className="text-sm text-slate-500">
        As informações detalhadas já foram respondidas no diagnóstico. Use este painel apenas para aprovar ou revisar os blocos operacionais do lançamento.
      </p>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Blocos</p>
        <div className="grid gap-3 md:grid-cols-2">
          {checklist.blocks.map((block) => (
            <button
              key={block.id}
              onClick={() => handleBlockToggle(block)}
              disabled={pending.blockId === block.id}
              className={`flex flex-col rounded-xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200 ${
                block.status === "approved"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em]">
                <span>{block.id}</span>
                <span className="font-semibold">
                  {block.status === "approved" ? "OK" : "PENDENTE"}
                </span>
              </div>
              <p className="text-base font-semibold">{block.title}</p>
              <p className={`text-sm ${block.status === "approved" ? "text-emerald-600" : "text-slate-500"}`}>
                {block.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
