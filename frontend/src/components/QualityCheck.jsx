import { useEffect, useState } from 'react'
import { evaluatePrompt, getEvaluation, getErrorMessage } from '../api/prompts'

const CRITERIA = [
    ['relevance', 'Relevance'],
    ['completeness', 'Completeness'],
    ['instructionFollowing', 'Instruction following'],
    ['formatCorrectness', 'Format'],
]

function verdict(delta) {
    if (delta > 0.25) return { text: 'The optimized prompt gave a better answer', cls: 'bg-green-100 text-green-700' }
    if (delta >= -0.25) return { text: 'Answer quality preserved', cls: 'bg-green-100 text-green-700' }
    if (delta >= -0.75) return { text: 'Slightly lower answer quality', cls: 'bg-amber-100 text-amber-700' }
    return { text: 'Answer quality dropped', cls: 'bg-red-100 text-red-700' }
}

function ResponseCard({ title, row }) {
    return (
        <div className="rounded-lg border bg-gray-50 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <span className="text-sm font-bold text-indigo-600">{row.overallScore.toFixed(2)} / 5</span>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
                {CRITERIA.map(([key, label]) => (
                    <span key={key} className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200">
                        {label}: {row[key]}
                    </span>
                ))}
            </div>
            <p className="mb-3 text-xs italic text-gray-600">{row.judgeRationale}</p>
            <details>
                <summary className="cursor-pointer text-sm font-medium text-indigo-600">Show response</summary>
                <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded bg-white p-3 text-xs text-gray-800">
                    {row.responseText}
                </pre>
            </details>
        </div>
    )
}

export default function QualityCheck({ sessionId, currentRun }) {
    const [data, setData] = useState(null) // { summary, responses } or null
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setData(null)
        setError('')
        getEvaluation(sessionId)
            .then((res) => { if (!cancelled) setData(res) })
            .catch((err) => {
                if (cancelled) return
                if (err.response?.status !== 404) {
                    setError(getErrorMessage(err, 'Could not load the quality check'))
                }
            })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [sessionId])

    const run = async () => {
        setRunning(true)
        setError('')
        try {
            setData(await evaluatePrompt(sessionId))
        } catch (err) {
            setError(getErrorMessage(err, 'Quality check failed'))
        } finally {
            setRunning(false)
        }
    }

    const original = data?.responses.find((r) => r.variant === 'original')
    const optimized = data?.responses.find((r) => r.variant === 'optimized')
    const s = data?.summary
    const stale = s && currentRun != null && s.runNumber < currentRun
    const v = s ? verdict(s.qualityDelta) : null

    return (
        <div className="rounded-lg border bg-white p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Answer quality check</h2>
                    <p className="text-sm text-gray-500">
                        Sends your original and your optimized prompt to the model, then an AI judge scores
                        both answers against your original prompt.
                    </p>
                </div>
                {data && (
                    <button
                        onClick={run}
                        disabled={running}
                        className="rounded-full border px-4 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                    >
                        {running ? 'Running…' : 'Run again'}
                    </button>
                )}
            </div>

            {error && <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            {loading && <p className="text-sm text-gray-500">Loading…</p>}

            {!loading && !data && (
                <div>
                    <button
                        onClick={run}
                        disabled={running}
                        className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {running ? 'Running quality check…' : 'Run quality check'}
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                        Takes about 10 to 20 seconds and makes 4 model calls.
                    </p>
                </div>
            )}

            {data && original && optimized && (
                <div className="space-y-4">
                    {stale && (
                        <p className="rounded bg-amber-50 p-3 text-sm text-amber-700">
                            This check was run on an earlier version of the optimized prompt. Run it again to
                            check the latest one.
                        </p>
                    )}

                    <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${v.cls}`}>
                        {v.text}
                    </span>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Original answer</p>
                            <p className="text-xl font-bold text-gray-900">{s.qualityOriginal.toFixed(2)} / 5</p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Optimized answer</p>
                            <p className="text-xl font-bold text-gray-900">{s.qualityOptimized.toFixed(2)} / 5</p>
                        </div>
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Quality retained</p>
                            <p className="text-xl font-bold text-green-600">{s.qualityRetentionPct}%</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <ResponseCard title="Answer to your original prompt" row={original} />
                        <ResponseCard title="Answer to the optimized prompt" row={optimized} />
                    </div>

                    <p className="text-xs text-gray-500">
                        Scored by an AI judge, which tends to be generous. Use the scores as a rough guide and
                        read the two answers yourself.
                    </p>
                </div>
            )}
        </div>
    )
}