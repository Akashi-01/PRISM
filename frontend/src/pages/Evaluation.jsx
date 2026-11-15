import { useEffect, useState } from 'react'
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ScatterChart, Scatter, ReferenceLine,
} from 'recharts'
import { getEvaluationOverview, getErrorMessage } from '../api/prompts'
import Spinner from '../components/Spinner'
import ErrorBanner from '../components/ErrorBanner'

const TAGS = ['verbose', 'redundant', 'structured', 'concise', 'vague']
const COLORS = ['#94a3b8', '#4f46e5'] // baseline grey, latest indigo
const pct = (v) => (v == null ? '—' : `${v}%`)

function StatCard({ label, value, hint }) {
    return (
        <div className="rounded-lg border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    )
}

function ChartCard({ title, subtitle, children }) {
    return (
        <div className="rounded-lg border bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mb-3 text-sm text-gray-500">{subtitle}</p>
            <div className="h-72">{children}</div>
        </div>
    )
}

export default function Evaluation() {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        getEvaluationOverview()
            .then((res) => { if (!cancelled) setData(res) })
            .catch((err) => {
                if (cancelled) return
                setError(getErrorMessage(err, 'Could not load evaluation results'))
            })
        return () => { cancelled = true }
    }, [])

    if (error) return <ErrorBanner message={error} />
    if (!data) return <Spinner />

    const exps = data.experiments
    if (exps.length === 0) {
        return (
            <div className="rounded-lg border bg-white p-8 text-center text-gray-600">
                No experiments found. Run one with <code>npm run experiment</code>.
            </div>
        )
    }

    const base = exps[0]
    const latest = exps[exps.length - 1]
    const compare = exps.length > 1
    const hint = (get) => (compare ? `${base.name}: ${get(base)}` : undefined)

    const tagData = (metric) =>
        TAGS.map((tag) => {
            const row = { tag }
            exps.forEach((e) => { row[e.name] = e.byTag.find((t) => t.tag === tag)?.[metric] ?? null })
            return row
        })

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Evaluation</h1>
                <p className="text-sm text-gray-500">
                    The same {latest.overall.n} test prompts, run before and after the optimizer fixes.
                    Quality is scored by an LLM judge and checked by a human on a sample.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Tokens saved (aggregate)"
                    value={pct(latest.overall.aggregateSavedPct)}
                    hint={hint((e) => pct(e.overall.aggregateSavedPct))}
                />
                <StatCard
                    label="Tokens saved (median)"
                    value={pct(latest.overall.medianSavedPct)}
                    hint={hint((e) => pct(e.overall.medianSavedPct))}
                />
                <StatCard
                    label="Quality retention (judge)"
                    value={pct(latest.overall.retentionPct)}
                    hint={hint((e) => pct(e.overall.retentionPct))}
                />
                <StatCard
                    label="Judged quality losses"
                    value={`${latest.overall.losses} of ${latest.overall.n}`}
                    hint={hint((e) => `${e.overall.losses} of ${e.overall.n}`)}
                />
            </div>

            <ChartCard title="Tokens saved by prompt style" subtitle="Aggregate % saved. Below zero means the prompt got longer.">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tagData('aggregateSavedPct')}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tag" />
                        <YAxis unit="%" />
                        <Tooltip />
                        <Legend />
                        <ReferenceLine y={0} stroke="#64748b" />
                        {exps.map((e, i) => (
                            <Bar key={e.name} dataKey={e.name} fill={COLORS[Math.min(i, 1)]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Quality retention by prompt style" subtitle="Judge score of the optimized response as % of the original response.">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tagData('retentionPct')}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tag" />
                        <YAxis unit="%" domain={[60, 105]} />
                        <Tooltip />
                        <Legend />
                        {exps.map((e, i) => (
                            <Bar key={e.name} dataKey={e.name} fill={COLORS[Math.min(i, 1)]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Efficiency vs quality, per prompt" subtitle="Each dot is one test prompt. Right = more tokens saved, below the line = judged quality loss.">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="savedPct" name="Tokens saved" unit="%" />
                        <YAxis type="number" dataKey="delta" name="Quality change" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend />
                        <ReferenceLine y={0} stroke="#64748b" />
                        {exps.map((e, i) => (
                            <Scatter key={e.name} name={e.name} data={e.points} fill={COLORS[Math.min(i, 1)]} />
                        ))}
                    </ScatterChart>
                </ResponsiveContainer>
            </ChartCard>

            <div className="rounded-lg border bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Human cross-check</h2>
                <p className="mb-3 text-sm text-gray-500">
                    One person scored 12 prompts per version, blind to which response came from which prompt.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {exps.filter((e) => e.human).map((e) => (
                        <div key={e.name} className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700">
                            <p className="font-semibold text-gray-900">{e.name}</p>
                            <p className="mt-1">
                                Human score: {e.human.meanOriginal} original, {e.human.meanOptimized} optimized
                                ({e.human.retentionPct}% retention)
                            </p>
                            <p>
                                Optimized was better in {e.human.better}, equal in {e.human.equal},
                                worse in {e.human.worse} of {e.human.n} prompts.
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-500">
                The LLM judge is lenient: it rated almost every original response 5 out of 5, so it cannot see small
                quality differences. Treat judge scores as a coarse screen and read them together with the human check.
            </p>
        </div>
    )
}