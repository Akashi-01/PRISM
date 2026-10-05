import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TokenSavingsCard from "../components/TokenSavingsCard";
import PromptComparison from "../components/PromptComparison";
import AnalysisPanel from "../components/AnalysisPanel";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export default function ResultsPage() {
  const { id } = useParams();
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API}/api/prompts/${id}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
        return body.data;
      })
      .then((data) => !cancelled && setRun(data))
      .catch((err) => {
        if (cancelled) return;
        // fetch throws TypeError when the backend is unreachable
        setError(err instanceof TypeError ? "Cannot reach the server. Is the backend running?" : err.message);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <p className="p-8 text-gray-500">Loading run…</p>;

  if (error || !run) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <p className="mb-4 text-red-600">{error || "Run not found."}</p>
        <Link to="/" className="text-indigo-600 underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Run #{run.id}</h1>
          <p className="text-sm text-gray-500">
            {run.model} · {run.latencyMs ? `${(run.latencyMs / 1000).toFixed(1)}s` : "n/a"} ·{" "}
            {new Date(run.createdAt).toLocaleString()}
          </p>
        </div>
        <Link to="/" className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">
          New prompt
        </Link>
      </header>

      <TokenSavingsCard
        before={run.tokensBefore}
        after={run.tokensAfter}
        saved={run.tokensSaved ?? run.tokensBefore - run.tokensAfter}
        percent={run.percentSaved}
      />
      <PromptComparison
        raw={run.rawPrompt}
        optimized={run.optimizedPrompt}
        tokensBefore={run.tokensBefore}
        tokensAfter={run.tokensAfter}
      />
      <AnalysisPanel analysis={run.analysis} />
    </div>
  );
}