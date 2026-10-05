import Section from './Section'

function parse(analysis) {
    if (typeof analysis === 'string') {
        try { return JSON.parse(analysis) } catch { return {} }
    }
    return analysis ?? {}
}

// Turn any value into displayable text
function toText(v) {
    if (v == null) return ''
    if (typeof v === 'string' || typeof v === 'number') return String(v)
    if (Array.isArray(v)) return v.map(toText).join(', ')
    if (typeof v === 'object') {
        return Object.entries(v).map(([k, val]) => `${k}: ${toText(val)}`).join(' · ')
    }
    return String(v)
}

// Accept camelCase or snake_case keys
const pick = (a, ...keys) => keys.map((k) => a[k]).find((v) => v !== undefined)

export default function AnalysisPanel({ analysis }) {
    const a = parse(analysis)
    const intent = pick(a, 'intent') ?? {}
    const requirements = Array.isArray(pick(a, 'requirements')) ? pick(a, 'requirements') : []
    const missing = Array.isArray(pick(a, 'missingInfo', 'missing_info')) ? pick(a, 'missingInfo', 'missing_info') : []
    const redundancy = Array.isArray(pick(a, 'redundancyFlags', 'redundancy_flags', 'redundancies'))
    ? pick(a, 'redundancyFlags', 'redundancy_flags', 'redundancies')
    : []

    return (
        <Section title="Analysis">
            <div className="space-y-5">
                <Block title="Intent">
                    <div className="flex flex-wrap items-center gap-2">
                        {intent.category && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                {intent.category}
                            </span>
                        )}
                        <p className="text-gray-800">{toText(intent.summary ?? intent) || 'Not detected'}</p>
                    </div>
                </Block>

                <Block title="Requirements">
                    {requirements.length === 0 ? (
                        <p className="text-sm text-gray-400">None extracted</p>
                    ) : (
                        <ul className="space-y-2">
                            {requirements.map((r, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-800">
                                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                                        r.type === 'explicit' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {r.type ?? 'req'}
                                    </span>
                                    <span>{toText(r.text ?? r)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Block>

                <Block title="Missing info">
                    {missing.length === 0 ? (
                        <p className="text-sm text-gray-400">Nothing missing</p>
                    ) : (
                        <ul className="space-y-2">
                            {missing.map((m, i) => (
                                <li key={i} className="rounded border-l-4 border-amber-400 bg-amber-50 px-3 py-2">
                                    <p className="font-medium text-gray-900">{toText(m.item ?? m)}</p>
                                    {m.why && <p className="text-sm text-gray-600">{toText(m.why)}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </Block>

                <Block title="Redundancy flags">
                    {redundancy.length === 0 ? (
                        <p className="text-sm text-gray-400">None found</p>
                    ) : (
                        <ul className="space-y-2">
                            {redundancy.map((r, i) => (
                                <li key={i} className="rounded border-l-4 border-rose-300 bg-rose-50 px-3 py-2">
                                    <p className="font-medium text-gray-900">"{toText(r.text ?? r)}"</p>
                                    {r.reason && <p className="text-sm text-gray-600">{toText(r.reason)}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </Block>
            </div>
        </Section>
    )
}

function Block({ title, children }) {
    return (
        <div>
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
            {children}
        </div>
    )
}

