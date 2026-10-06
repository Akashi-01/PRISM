import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzePrompt, getErrorMessage} from '../api/prompts';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';
import LoadingStages from "../components/LoadingStages";


const SAMPLES = [
  {
    label: "Verbose email",
    text: "Hi, I hope you are doing well today. I would like you to please help me write an email. The email is for my manager. Basically what I need is an email to my manager about taking leave. I want to take some leave from work, so please write the email for me. It should be a polite email and it should be professional, and also make sure the tone is polite and respectful because he is my manager. Please make it not too long but also not too short.",
  },
  {
    label: "Study plan",
    text: "I need you to please help me with creating a study plan. Basically I have exams coming up in about three weeks and I want you to make a really good study plan for me that covers all my subjects, and I would like it to be detailed but also not too complicated, and please make sure that it is realistic and that I can actually follow it every day without getting tired.",
  },
  {
    label: "Vague signup page",
    text: "I want to design a signup page",
  },
];

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
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-6 ring-1 ring-indigo-100">
                <h1 className="text-3xl font-extrabold text-gray-900">Optimize a prompt</h1>
                <p className="mt-1 text-gray-600">
                    Paste a raw prompt. PRISM analyzes it, rewrites it, and shows the token savings.
                </p>
            </div>

            {/* example buttons */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Try an example:</span>
            {SAMPLES.map((s) => (
                <button
                key={s.label}
                type="button"
                disabled={loading}
                onClick={() => setPrompt(s.text)}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                {s.label}
                </button>
            ))}
            </div>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                rows={8}
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

            {loading && <LoadingStages />}
            <ErrorBanner message={error} />
        </div>
    )
}