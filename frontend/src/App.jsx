import { Routes, Route } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PromptInput from '../pages/PromptInput'
import Results from '../pages/Results'
import History from '../pages/History'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<PromptInput />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </div>
  )
}