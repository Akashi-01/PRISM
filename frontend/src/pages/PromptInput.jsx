import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzePrompt, getErrorMessage} from '../api/prompts'
import Spinner from '../components/Spinner'
import ErrorBanner from '../components/ErrorBanner'

export default function PromptInput() {
    const navigate = useNavigate()          // 1. call the hook at the top of the component
    const [prompt, setPrompt] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
    if (loading || !prompt.trim()) return          // guard against double submits
    setLoading(true)
    setError('')
    try {
        const result = await analyzePrompt(prompt.trim())   // send trimmed text
        navigate(`/results/${result.id}`)
    } catch (err) {
        setError(getErrorMessage(err))
    } finally {
        setLoading(false)
    }
}

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Optimize a prompt</h1>
                <p className="text-gray-600 mt-1">
                    Paste a raw prompt. PRISM analyzes it, rewrites it, and shows the token savings.
                </p>
            </div>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                rows={12}
                placeholder="Paste your raw prompt here…"
                className="w-full rounded-lg border border-gray-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />

            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{prompt.length} characters</span>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !prompt.trim()}
                    className="rounded-md bg-indigo-600 px-5 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Working…' : 'Analyze & Optimize'}
                </button>
            </div>

            {loading && <Spinner label="Analyzing and optimizing… this can take several seconds" />}
            <ErrorBanner message={error} />
        </div>
    )
}