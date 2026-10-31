import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TokenSavingsCard from "../components/TokenSavingsCard";
import PromptComparison from "../components/PromptComparison";
import AnalysisPanel from "../components/AnalysisPanel";
import PipelineStepper from "../components/PipelineStepper";
import MissingInfoPanel from "../components/MissingInfoPanel";
import RefinementCompare from "../components/RefinementCompare";
import ErrorBanner from "../components/ErrorBanner";
import {
  getPrompt,
  getErrorMessage,
  submitAnswers,
  rerunFromStage,
} from "../api/prompts";

export default function ResultsPage() {
  const { id } = useParams();
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [previous, setPrevious] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRun(null);
    setPrevious(null);
    setActionError("");

    getPrompt(id)
      .then((data) => {
        if (!cancelled) setRun(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.status === 404 ? "Run not found." : getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // runs a re-run / answers call, then swaps in the updated session
  async function runAction(fn) {
    if (busy || !run) return;
    setBusy(true);
    setActionError("");
    const snapshot = {
      optimizedPrompt: run.optimizedPrompt,
      tokensAfter: run.tokensAfter,
      percentSaved: run.percentSaved,
    };
    try {
      const data = await fn();
      setPrevious(snapshot);
      setRun(data);
    } catch (err) {
      setActionError(getErrorMessage(err));
      // reload so a failed stage shows up in the stepper
      getPrompt(id).then(setRun).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  const handleAnswers = (answers) => runAction(() => submitAnswers(run.id, answers));
  const handleRerun = (stage) => runAction(() => rerunFromStage(run.id, stage));

  if (loading) return <p className="p-8 text-gray-500">Loading run…</p>;

  if (error || !run) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <p className="mb-4 text-red-600">{error || "Run not found."}</p>
        <Link to="/" className="text-indigo-600 underline">Back to home</Link>
      </div>
    );
  }

  const stages = run.stages ?? [];
  const missingRow = stages.find((s) => s.stage === "missingInfo" && s.status === "success");
  const missingItems = missingRow?.output?.items ?? run.analysis?.missingInfo?.items ?? [];
  const savedAnswers = Array.isArray(run.clarifications) ? run.clarifications : [];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Run #{run.runNumber ?? run.id}</h1>
          <p className="text-sm text-gray-500">
            {run.model} · {run.latencyMs ? `${(run.latencyMs / 1000).toFixed(1)}s` : "n/a"} ·{" "}
            {new Date(run.createdAt).toLocaleString()}
            {run.currentRun > 1 && ` · revision ${run.currentRun}`}
          </p>
        </div>
        <Link to="/" className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">
          New prompt
        </Link>
      </header>

      <ErrorBanner message={actionError} />

      <PipelineStepper stages={stages} onRerun={handleRerun} busy={busy} />

      <MissingInfoPanel
        items={missingItems}
        saved={savedAnswers}
        onSubmit={handleAnswers}
        busy={busy}
        disabled={stages.length === 0}
      />

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

      <RefinementCompare
        previous={previous}
        current={{
          optimizedPrompt: run.optimizedPrompt,
          tokensAfter: run.tokensAfter,
          percentSaved: run.percentSaved,
        }}
      />

      <AnalysisPanel analysis={run.analysis} />
    </div>
  );
}