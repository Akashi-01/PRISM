export default function TokenSavingsCard({ before, after, saved, percent }) {
  const positive = saved > 0;
  const pct = Number(percent);
  const barWidth = before > 0 ? Math.min(100, (after / before) * 100) : 100;

  return (
    <section
      className={`rounded-2xl p-6 text-white shadow-lg md:p-8 ${
        positive
          ? "bg-gradient-to-r from-indigo-600 to-violet-600"
          : "bg-gradient-to-r from-slate-700 to-slate-600"
      }`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider opacity-80">
            {positive ? "Tokens saved" : "Structure added"}
          </p>
          <p className="text-6xl font-bold leading-none md:text-7xl">
            {pct.toFixed(1)}%
          </p>
        </div>

        <div className="flex gap-6 text-right">
          <Stat label="Before" value={before} />
          <Stat label="After" value={after} />
          <Stat label={positive ? "Saved" : "Added"} value={Math.abs(saved)} />
        </div>
      </div>

      <div className="mt-6">
        <div className="h-3 w-full rounded-full bg-white/20">
          <div
            className="h-3 rounded-full bg-white transition-all duration-1000"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs opacity-80">
          <span>{after} tokens after</span>
          <span>{before} tokens before</span>
        </div>
      </div>

      {!positive && (
        <p className="mt-4 text-sm opacity-90">
          This prompt was short, so the optimizer added structure instead of cutting length.
        </p>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs uppercase tracking-wide opacity-75">{label}</div>
    </div>
  );
}