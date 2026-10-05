import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPrompts } from '../api/prompts'
import Spinner from '../components/Spinner'
import ErrorBanner from '../components/ErrorBanner'

export default function History() {
    const [runs, setRuns] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false

        listPrompts()
            .then((res) => { if (!cancelled) setRuns(res) })
            .catch((err) => {
                if (cancelled) return
                setError(
                    err.response
                        ? err.response.data?.error || 'Could not load history'
                        : 'Cannot reach the server. Is the backend running?'
                )
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

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">History</h1>

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
                            return (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link to={`/results/${r.id}`} className="font-medium text-indigo-600 hover:underline">
                                            #{r.id}
                                        </Link>
                                    </td>
                                    <td className="max-w-xs truncate px-4 py-3 text-gray-700" title={r.rawPrompt}>
                                        {r.rawPrompt}
                                    </td>
                                    <td className="px-4 py-3 text-right">{r.tokensBefore}</td>
                                    <td className="px-4 py-3 text-right">{r.tokensAfter}</td>
                                    <td className={`px-4 py-3 text-right font-semibold ${percent > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                        {percent.toFixed(1)}%
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