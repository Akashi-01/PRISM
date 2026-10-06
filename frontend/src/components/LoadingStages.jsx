import { useEffect, useState } from "react";

const stages = [
  "Analyzing intent…",
  "Extracting requirements…",
  "Finding missing information…",
  "Flagging redundancy…",
  "Rewriting the prompt…",
  "Counting tokens…",
];

export default function LoadingStages() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, stages.length - 1)), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <p className="font-medium text-gray-800">{stages[i]}</p>
      <p className="mt-1 text-sm text-gray-500">This usually takes 20 to 40 seconds.</p>
      <div className="mx-auto mt-4 h-1.5 w-48 rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full bg-indigo-600 transition-all duration-1000"
          style={{ width: `${((i + 1) / stages.length) * 100}%` }}
        />
      </div>
    </div>
  );
}