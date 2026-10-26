import { useState } from "react";
import Section from "./Section";

export default function RefinementCompare({ previous, current }) {
  if (!previous) return null;

  const delta =
    previous.tokensAfter != null && current.tokensAfter != null
      ? current.tokensAfter - previous.tokensAfter
      : null;

  return (
    <Section title="What changed in this update">
      {delta !== null && (
        <p className="mb-3 text-sm text-gray-600">
          Optimized prompt went from {previous.tokensAfter} to {current.tokensAfter} tokens (
          {delta > 0 ? "+" : ""}
          {delta}). Savings vs. your original: {Number(previous.percentSaved).toFixed(1)}% →{" "}
          {Number(current.percentSaved).toFixed(1)}%.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Box label="Previous version" text={previous.optimizedPrompt} />
        <Box label="Updated version" text={current.optimizedPrompt} accent copyable />
      </div>
    </Section>
  );
}

function Box({ label, text, accent, copyable }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed. Select the text and copy it manually.");
    }
  };

  return (
    <div
      className={`rounded-lg border p-3 ${
        accent ? "border-indigo-200 bg-indigo-50/40" : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {copyable && (
          <button
            type="button"
            onClick={copy}
            className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-sm text-gray-800">
        {text}
      </pre>
    </div>
  );
}