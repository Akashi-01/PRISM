import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";

export default function TokenSavingsChart({ runs }) {
  if (!runs?.length) {
    return <p className="text-sm text-gray-500">No runs yet. Analyze a prompt to see the chart.</p>;
  }

  // listPrompts is probably newest-first; the chart should read oldest → newest
  const data = [...runs].reverse().map((r, i) => ({
    run: `#${r.id}`,
    before: r.tokensBefore,
    after: r.tokensAfter,
    percentSaved: Number(r.percentSaved),
  }));

  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="font-semibold mb-1">Token usage per run</h2>
      <p className="text-xs text-gray-500 mb-3">Original vs optimized prompt</p>
      <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="run" />
                <YAxis label={{ value: "tokens", angle: -90, position: "insideLeft" }} />
                <Tooltip/>
                <Legend />
                <Bar dataKey="before" name="Before" fill="#94a3b8" />
                <Bar dataKey="after" name="After" fill="#4f46e5" />
            </BarChart>
            </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Longer prompts benefit most. Very short prompts can grow because the optimizer adds structure.
      </p>
    </div>
  );
}