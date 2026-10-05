import { useState } from "react";
import Section from "./Section";

function getFlagTexts(analysis) {
  let a = analysis;
  if (typeof a === "string") {
    try { a = JSON.parse(a); } catch { return []; }
  }
  const list = a?.redundancyFlags ?? a?.redundancy_flags ?? a?.redundancies ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((r) => (typeof r === "string" ? r : r?.text))
    .filter(Boolean)
    .map((t) => String(t).trim().replace(/^["']|["']$/g, ""));
}

// Split text into [{ t, hit }] segments. Flags that don't match exactly are skipped.
function buildSegments(text, flags) {
  const lower = text.toLowerCase();
  const ranges = [];
  flags.forEach((f) => {
    const i = lower.indexOf(f.toLowerCase());
    if (i !== -1) ranges.push([i, i + f.length]);
  });
  ranges.sort((a, b) => a[0] - b[0]);

  const merged = [];
  ranges.forEach(([s, e]) => {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  });

  const out = [];
  let pos = 0;
  merged.forEach(([s, e]) => {
    if (s > pos) out.push({ t: text.slice(pos, s), hit: false });
    out.push({ t: text.slice(s, e), hit: true });
    pos = e;
  });
  if (pos < text.length) out.push({ t: text.slice(pos), hit: false });
  return { segments: out, count: merged.length };
}

export default function PromptComparison({ raw, optimized, tokensBefore, tokensAfter, analysis }) {
  const [copied, setCopied] = useState(false);
  const { segments, count } = buildSegments(raw, getFlagTexts(analysis));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(optimized);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed. Select the text and copy it manually.");
    }
  };

  return (
    <Section title="Original vs optimized">
      {count > 0 && (
        <p className="mb-3 text-sm text-gray-500">
          <mark className="rounded bg-red-100 px-1 text-red-700 line-through">Highlighted</mark>{" "}
          text was flagged as redundant and removed in the optimized version.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel label="Original" tokens={tokensBefore}>
          {segments.map((s, i) =>
            s.hit ? (
              <mark key={i} className="rounded bg-red-100 px-0.5 text-red-700 line-through">
                {s.t}
              </mark>
            ) : (
              <span key={i}>{s.t}</span>
            )
          )}
        </Panel>
        <Panel
          label="Optimized"
          tokens={tokensAfter}
          accent
          action={
            <button
              onClick={copy}
              className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          }
        >
          {optimized}
        </Panel>
      </div>
    </Section>
  );
}

function Panel({ label, tokens, action, accent, children }) {
  return (
    <div
      className={`flex flex-col rounded-lg border p-3 ${
        accent ? "border-indigo-200 bg-indigo-50/40" : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {label} <span className="text-gray-400">· {tokens} tokens</span>
        </span>
        {action}
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words font-mono text-sm text-gray-800">
        {children}
      </pre>
    </div>
  );
}