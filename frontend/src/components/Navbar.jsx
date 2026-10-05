import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) =>
    `rounded px-3 py-1 text-sm font-medium ${
        isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-gray-900'
    }`

export default function Navbar() {
    return (
        <nav className="border-b bg-white">
            <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
                <span className="font-bold text-indigo-600">PRISM</span>
                <NavLink to="/" end className={linkClass}>New Prompt</NavLink>
                <NavLink to="/history" className={linkClass}>History</NavLink>
            </div>
        </nav>
    )
}