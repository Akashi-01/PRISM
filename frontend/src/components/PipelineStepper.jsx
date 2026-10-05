import { Check } from "lucide-react";

const steps = ["Raw prompt", "Analyze", "Optimize", "Metrics"];

export default function PipelineStepper() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-sm">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white">
            <Check size={14} strokeWidth={3} />
          </span>
          <span className="text-sm font-medium text-gray-700">{s}</span>
          {i < steps.length - 1 && (
            <span className="h-px w-6 bg-gray-300 sm:w-10" />
          )}
        </div>
      ))}
    </div>
  );
}