import { useState } from "react";
import Section from "./Section";

export default function PromptComparison({ raw, optimized, tokensBefore, tokensAfter }) {
  const [copied, setCopied] = useState(false);

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
      <div className="grid gap-4 md:grid-cols-2">
        <Panel label="Original" tokens={tokensBefore} text={raw} />
        <Panel
          label="Optimized"
          tokens={tokensAfter}
          text={optimized}
          action={
            <button
              onClick={copy}
              className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          }
        />
      </div>
    </Section>
  );
}

function Panel({ label, tokens, text, action }) {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {label} <span className="text-gray-400">· {tokens} tokens</span>
        </span>
        {action}
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words font-mono text-sm text-gray-800">
        {text}
      </pre>
    </div>
  );
}