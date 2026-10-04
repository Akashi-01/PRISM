import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPrompt } from '../src/api/prompts'
import Spinner from '../components/Spinner'
import ErrorBanner from '../components/ErrorBanner'

export default function Results() {
    const { id } = useParams()
    const [data, setData] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        getPrompt(id)
            .then(setData)
            .catch((err) => setError(err.response?.data?.error || err.message || 'Could not load this run'))
    }, [id])

    if (error) return <ErrorBanner message={error} />
    if (!data) return <Spinner />

    return (
        <pre className="bg-white border rounded-lg p-4 text-xs overflow-auto">
            {JSON.stringify(data, null, 2)}
        </pre>
    )
}