import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl text-indigo-600">PRISM</Link>
        <div className="flex gap-4 text-sm">
          <Link to="/" className="text-gray-600 hover:text-gray-900">New prompt</Link>
          <Link to="/history" className="text-gray-600 hover:text-gray-900">History</Link>
        </div>
      </div>
    </nav>
  )
}