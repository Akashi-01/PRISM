import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TokenSavingsCard from "../components/TokenSavingsCard";
import PromptComparison from "../components/PromptComparison";
import AnalysisPanel from "../components/AnalysisPanel";
import { getPrompt, getErrorMessage } from '../api/prompts';
import PipelineStepper from "../components/PipelineStepper";

export default function ResultsPage() {
  const { id } = useParams();
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  let cancelled = false
  setLoading(true)
  setError(null)
  setRun(null)

  getPrompt(id)
    .then((data) => { if (!cancelled) setRun(data) })
    .catch((err) => {
      if (cancelled) return
      setError(err.response?.status === 404 ? 'Run not found.' : getErrorMessage(err))
    })
    .finally(() => { if (!cancelled) setLoading(false) })
  return () => { cancelled = true }
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
    <div className="space-y-5">
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

      <PipelineStepper />

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