import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";

/* Custom tooltip that shows Before / After tokens and percent saved */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const before = payload.find((p) => p.dataKey === "before")?.value ?? "–";
  const after = payload.find((p) => p.dataKey === "after")?.value ?? "–";
  const pct = payload[0]?.payload?.percentSaved;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <p><span className="text-gray-500">Before:</span> {before} tokens</p>
      <p><span className="text-gray-500">After:</span> {after} tokens</p>
      {pct != null && (
        <p className={pct > 0 ? "text-green-600" : "text-amber-600"}>
          {pct > 0 ? "Saved" : "Grew"} {Math.abs(pct).toFixed(1)}%
        </p>
      )}
    </div>
  );
}

export default function TokenSavingsChart({ runs }) {
  if (!runs?.length) {
    return <p className="text-sm text-gray-500">No runs yet. Analyze a prompt to see the chart.</p>;
  }

  // listPrompts is newest-first; reverse so chart reads oldest → newest.
  // Use sequential run numbers (1, 2, 3…) instead of DB ids to avoid gaps.
  const data = [...runs].reverse().map((r, i) => ({
    run: `#${i + 1}`,
    before: r.tokensBefore,
    after: r.tokensAfter,
    percentSaved: Number(r.percentSaved),
  }));

  // Round Y-axis max up to the nearest nice tick value
  const maxVal = Math.max(...data.map((d) => Math.max(d.before ?? 0, d.after ?? 0)));
  const yStep = maxVal <= 50 ? 10 : maxVal <= 200 ? 25 : maxVal <= 500 ? 50 : 100;
  const yMax = Math.ceil(maxVal / yStep) * yStep;

  // Show every Nth label on the x-axis so they don't overlap
  const tickInterval = data.length <= 15 ? 0 : data.length <= 30 ? 1 : 2;

  // Guarantee a minimum width per bar-pair so bars stay readable
  const MIN_PX_PER_BAR = 40;
  const chartMinWidth = Math.max(data.length * MIN_PX_PER_BAR, 500);

  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="font-semibold mb-1">Token usage per run</h2>
      <p className="text-xs text-gray-500 mb-3">Original vs optimized prompt</p>
      <div className="h-80 overflow-x-auto">
        <div style={{ width: `${chartMinWidth}px`, height: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="20%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="run"
                interval={tickInterval}
                tick={{ fontSize: 12 }}
                tickMargin={6}
              />
              <YAxis
                domain={[0, yMax]}
                tickCount={6}
                label={{ value: "tokens", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="after" name="After" fill="#4f46e5" radius={[3, 3, 0, 0]} />
              <Bar dataKey="before" name="Before" fill="#94a3b8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Longer prompts benefit most. Very short prompts can grow because the optimizer adds structure.
      </p>
    </div>
  );
}