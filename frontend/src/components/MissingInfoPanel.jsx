import { useEffect, useState } from "react";
import Section from "./Section";
import { useElapsed } from "../hooks/useElapsed";

const IMPORTANCE_STYLE = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

export default function MissingInfoPanel({
  items = [],
  saved = [],
  onSubmit,
  busy = false,
  disabled = false,
}) {
  // old runs have no ids, so fall back to the position (q1, q2, ...) like the backend does
  const questions = items.map((it, i) => ({ ...it, id: it.id ?? `q${i + 1}` }));

  const itemsKey = questions.map((q) => q.id + q.question).join("|");
  const savedKey = JSON.stringify(saved);

  const [answers, setAnswers] = useState({});
  const elapsed = useElapsed(busy);

  // reset the form whenever the questions change or saved answers are loaded
  useEffect(() => {
    setAnswers(Object.fromEntries(saved.map((c) => [c.questionId, c.answer])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, savedKey]);

  const setAnswer = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const filled = Object.entries(answers)
    .filter(([, v]) => v && v.trim())
    .map(([questionId, answer]) => ({ questionId, answer: answer.trim() }));

  const handleSubmit = () => {
    if (busy || disabled || !filled.length) return;
    onSubmit(filled);
  };

  return (
    <Section title="Missing information">
      {questions.length === 0 ? (
        <p className="text-sm text-gray-400">Nothing important is missing from this prompt.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Answer any of these and the optimizer will rewrite your prompt using your answers.
            {saved.length > 0 && (
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                {saved.length} answer{saved.length > 1 ? "s" : ""} applied
              </span>
            )}
          </p>

          {questions.map((q) => (
            <div key={q.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-gray-900">{q.question}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    IMPORTANCE_STYLE[q.importance] ?? IMPORTANCE_STYLE.low
                  }`}
                >
                  {q.importance}
                </span>
              </div>

              {q.suggestedAnswers?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.suggestedAnswers.map((s) => {
                    const on = (answers[q.id] ?? "") === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={busy || disabled}
                        onClick={() => setAnswer(q.id, on ? "" : s)}
                        className={`rounded-full border px-3 py-1 text-xs transition disabled:opacity-50 ${
                          on
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}

              <input
                type="text"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                disabled={busy || disabled}
                maxLength={1000}
                placeholder="Type your own answer (optional)"
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy || disabled || !filled.length}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? `Re-optimizing… ${elapsed}s` : "Update optimized prompt"}
            </button>
            {disabled && (
              <span className="text-xs text-gray-500">
                This run has no saved stages, so it cannot be refined.
              </span>
            )}
            {!disabled && !filled.length && (
              <span className="text-xs text-gray-500">Answer at least one question to continue.</span>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}