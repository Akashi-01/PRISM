import { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import Section from "./Section";

const STAGE_META = [
  { key: "intent", label: "Intent" },
  { key: "requirements", label: "Requirements" },
  { key: "missingInfo", label: "Missing info" },
  { key: "redundancy", label: "Redundancy" },
  { key: "taskStructure", label: "Structure" },
  { key: "optimize", label: "Optimize" },
];

const MISSING_INFO_INDEX = 2;
const sec = (ms) => `${(ms / 1000).toFixed(1)}s`;

export default function PipelineStepper({ stages = [], onRerun, busy = false }) {
  const [selected, setSelected] = useState("optimize");

  if (!stages.length) {
    return (
      <Section title="Pipeline">
        <p className="text-sm text-gray-500">
          No stage data was saved for this run (it was created before the staged pipeline).
        </p>
      </Section>
    );
  }

  const byName = Object.fromEntries(stages.map((s) => [s.stage, s]));
  const totalTokens = stages.reduce((n, s) => n + s.inputTokens + s.outputTokens, 0);
  const totalMs = stages.reduce((n, s) => n + s.latencyMs, 0);
  const row = byName[selected];
  const selectedIndex = STAGE_META.findIndex((m) => m.key === selected);
  const selectedLabel = STAGE_META[selectedIndex]?.label;

  return (
    <Section title="Pipeline">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STAGE_META.map((m, i) => {
          const r = byName[m.key];
          const active = m.key === selected;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelected(m.key)}
              className={`rounded-lg border p-3 text-left transition ${
                active
                  ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <StatusDot status={r?.status} />
                <span className="text-sm font-medium text-gray-800">
                  {i + 1}. {m.label}
                </span>
              </div>
              {r ? (
                <p className="mt-1 text-xs text-gray-500">
                  {r.inputTokens + r.outputTokens} tok · {sec(r.latencyMs)}
                  {r.runNumber > 1 && (
                    <span className="ml-1 rounded bg-violet-100 px-1 text-violet-700">
                      rev {r.runNumber}
                    </span>
                  )}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">Not run</p>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Total: {totalTokens} tokens across {stages.length} stages · {sec(totalMs)}
      </p>

      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-800">{selectedLabel}</h3>
          {row && (
            <p className="text-xs text-gray-500">
              in {row.inputTokens} · out {row.outputTokens} · {sec(row.latencyMs)}
              {row.model ? ` · ${row.model}` : ""}
            </p>
          )}
        </div>

        <div className="mt-3">
          {!row ? (
            <p className="text-sm text-gray-500">This stage has not run yet.</p>
          ) : row.status === "failed" ? (
            <p className="rounded bg-red-50 p-2 text-sm text-red-700">
              Failed: {row.error || "unknown error"}
            </p>
          ) : (
            <StageOutput stage={selected} output={row.output} />
          )}
        </div>

        {onRerun && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onRerun(selected)}
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={14} />
              {busy ? "Working…" : "Re-run from this stage"}
            </button>
            {selectedIndex <= MISSING_INFO_INDEX && (
              <span className="text-xs text-gray-500">
                This also creates new questions, so your saved answers are cleared.
              </span>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

function StatusDot({ status }) {
  if (status === "success") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
        <Check size={13} strokeWidth={3} />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
        <X size={13} strokeWidth={3} />
      </span>
    );
  }
  return <span className="h-6 w-6 shrink-0 rounded-full border-2 border-gray-300" />;
}

function List({ items }) {
  if (!items?.length) return <p className="text-sm text-gray-400">None</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-800">
      {items.map((t, i) => (
        <li key={i}>{String(t)}</li>
      ))}
    </ul>
  );
}

function Label({ children }) {
  return (
    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</p>
  );
}

function StageOutput({ stage, output }) {
  if (!output) return null;

  switch (stage) {
    case "intent":
      return (
        <div className="space-y-2 text-sm text-gray-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {output.category}
            </span>
            {typeof output.confidence === "number" && (
              <span className="text-xs text-gray-500">
                confidence {Math.round(output.confidence * 100)}%
              </span>
            )}
          </div>
          <p>{output.primaryGoal}</p>
        </div>
      );

    case "requirements":
      return (
        <div className="space-y-3">
          <div>
            <Label>Explicit</Label>
            <List items={output.explicit} />
          </div>
          <div>
            <Label>Implicit</Label>
            <List items={output.implicit} />
          </div>
        </div>
      );

    case "missingInfo":
      return output.items?.length ? (
        <ul className="space-y-2">
          {output.items.map((m, i) => (
            <li key={m.id ?? i} className="rounded border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm">
              <span className="font-medium text-gray-900">{m.question}</span>
              <span className="ml-2 text-xs text-gray-500">({m.importance})</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">Nothing missing</p>
      );

    case "redundancy":
      return output.items?.length ? (
        <ul className="space-y-2">
          {output.items.map((r, i) => (
            <li key={i} className="rounded border-l-4 border-rose-300 bg-rose-50 px-3 py-2 text-sm">
              <p className="font-medium text-gray-900">"{r.text}"</p>
              <p className="text-gray-600">{r.reason}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">None found</p>
      );

    case "taskStructure":
      return (
        <div className="space-y-3 text-sm text-gray-800">
          <div>
            <Label>Role</Label>
            <p>{output.role}</p>
          </div>
          <div>
            <Label>Context</Label>
            <p>{output.context}</p>
          </div>
          <div>
            <Label>Constraints</Label>
            <List items={output.constraints} />
          </div>
          <div>
            <Label>Output format</Label>
            <p>{output.outputFormat}</p>
          </div>
        </div>
      );

    case "optimize":
      return (
        <div className="space-y-3 text-sm text-gray-800">
          <div>
            <Label>Optimized prompt</Label>
            <pre className="whitespace-pre-wrap break-words font-mono">{output.optimizedPrompt}</pre>
          </div>
          {output.changes?.length > 0 && (
            <div>
              <Label>Changes (model's description)</Label>
              <List items={output.changes} />
            </div>
          )}
        </div>
      );

    default:
      return (
        <pre className="overflow-auto text-xs text-gray-700">{JSON.stringify(output, null, 2)}</pre>
      );
  }
}