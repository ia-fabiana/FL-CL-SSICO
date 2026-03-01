import { useState } from "react";
import type {
  ChecklistBlock,
  ChecklistBlockId,
  ChecklistData,
  ChecklistFields,
} from "../types";
import { CHECKLIST_FIELD_METADATA } from "../checklist";

interface ChecklistPanelProps {
  checklist: ChecklistData;
  onUpdateBlock: (blockId: ChecklistBlockId, status: ChecklistBlock["status"]) => Promise<void>;
  onUpdateField: (fieldKey: keyof ChecklistFields, value: string) => Promise<void>;
}

interface PendingState {
  fieldKey?: keyof ChecklistFields;
  blockId?: ChecklistBlockId;
}

export function ChecklistPanel({ checklist, onUpdateBlock, onUpdateField }: ChecklistPanelProps) {
  const [pending, setPending] = useState<PendingState>({});
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = async (key: keyof ChecklistFields, value: string) => {
    try {
      setPending({ fieldKey: key });
      setError(null);
      await onUpdateField(key, value);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending({});
    }
  };

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
    <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/60">Comando Mestre</p>
          <h2 className="text-xl font-semibold text-white">Checklist operacional</h2>
        </div>
        {error && <span className="text-sm text-rose-400">{error}</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {CHECKLIST_FIELD_METADATA.map(({ key, label, placeholder }) => (
          <label key={key} className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/60">{label}</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
              placeholder={placeholder}
              value={checklist.fields[key] ?? ""}
              onChange={(event) => handleFieldChange(key, event.target.value)}
              disabled={pending.fieldKey === key}
            />
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Blocos</p>
        <div className="grid gap-3 md:grid-cols-2">
          {checklist.blocks.map((block) => (
            <button
              key={block.id}
              onClick={() => handleBlockToggle(block)}
              disabled={pending.blockId === block.id}
              className={`flex flex-col rounded-xl border px-4 py-3 text-left transition focus:outline-none ${
                block.status === "approved"
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-50"
                  : "border-white/10 bg-white/5 text-white"
              }`}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em]">
                <span>{block.id}</span>
                <span className="font-semibold">
                  {block.status === "approved" ? "OK" : "PENDENTE"}
                </span>
              </div>
              <p className="text-base font-semibold">{block.title}</p>
              <p className="text-sm text-white/70">{block.description}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
