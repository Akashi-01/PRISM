import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listPrompts, getErrorMessage } from '../api/prompts'
import Spinner from '../components/Spinner'
import ErrorBanner from '../components/ErrorBanner'
import TokenSavingsChart from '../components/TokenSavingsChart'

const badge = (pct) =>
    pct > 0
        ? { text: 'Compressed', cls: 'bg-green-100 text-green-700' }
        : { text: 'Expanded for clarity', cls: 'bg-amber-100 text-amber-700' }

export default function History() {
    const navigate = useNavigate()
    const [runs, setRuns] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false

        listPrompts()
            .then((res) => { if (!cancelled) setRuns(res) })
            .catch((err) => {
                if (cancelled) return
                setError(getErrorMessage(err, 'Could not load history'))
            })

        return () => { cancelled = true }
    }, [])

    if (error) return <ErrorBanner message={error} />
    if (!runs) return <Spinner />

    if (runs.length === 0) {
        return (
            <div className="rounded-lg border bg-white p-8 text-center">
                <p className="mb-3 text-gray-600">No runs yet.</p>
                <Link to="/" className="text-indigo-600 underline">Optimize your first prompt</Link>
            </div>
        )
    }

    const totalSaved = runs.reduce(
        (sum, r) => sum + (r.tokensSaved ?? r.tokensBefore - r.tokensAfter),
        0
    )

    const longRuns = runs.filter((r) => r.tokensBefore > 100)
    const avgLong = longRuns.length
        ? (longRuns.reduce((s, r) => s + Number(r.percentSaved ?? 0), 0) / longRuns.length).toFixed(1)
        : null

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">History</h1>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Runs</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{runs.length}</p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Total tokens saved</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{totalSaved}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                        Avg savings, prompts over 100 tokens
                    </p>
                    <p className="mt-1 text-2xl font-bold text-green-600">
                        {avgLong !== null ? `${avgLong}%` : '—'}
                    </p>
                </div>
            </div>

            <TokenSavingsChart runs={runs} />

            <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Run</th>
                            <th className="px-4 py-3">Prompt</th>
                            <th className="px-4 py-3 text-right">Before</th>
                            <th className="px-4 py-3 text-right">After</th>
                            <th className="px-4 py-3 text-right">Saved</th>
                            <th className="px-4 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {runs.map((r) => {
                            const percent = Number(r.percentSaved ?? 0)
                            const b = badge(percent)
                            return (
                                <tr
                                    key={r.id}
                                    onClick={() => navigate(`/results/${r.id}`)}
                                    className="cursor-pointer hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            to={`/results/${r.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="font-medium text-indigo-600 hover:underline"
                                        >
                                            #{r.id}
                                        </Link>
                                    </td>
                                    <td className="max-w-xs truncate px-4 py-3 text-gray-700" title={r.rawPrompt}>
                                        {r.rawPrompt}
                                    </td>
                                    <td className="px-4 py-3 text-right">{r.tokensBefore}</td>
                                    <td className="px-4 py-3 text-right">{r.tokensAfter}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        <span className={`font-semibold ${percent > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                            {percent.toFixed(1)}%
                                        </span>
                                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${b.cls}`}>
                                            {b.text}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                                        {new Date(r.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}