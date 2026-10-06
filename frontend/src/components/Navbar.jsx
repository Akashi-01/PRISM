import { NavLink, Link } from 'react-router-dom'
import logo from '../assets/logo.png'

const linkClass = ({ isActive }) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
    }`

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-10 bg-white shadow-sm">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-2">
                <Link to="/" className="flex items-center gap-3">
                    <img
                        src={logo}
                        alt="PRISM logo"
                        className="-ml-2 h-14 w-auto object-contain mix-blend-multiply"
                    />
                    <span className="hidden leading-tight sm:block">
                        <span className="block text-xl font-extrabold tracking-wide text-gray-900">PRISM</span>
                        <span className="text-[11px] uppercase tracking-widest text-indigo-600">
                            Prompt Refinement, Intent Structuring &amp; Metrics
                        </span>
                    </span>
                </Link>

                <div className="flex items-center gap-1">
                    <NavLink to="/" end className={linkClass}>New Prompt</NavLink>
                    <NavLink to="/history" className={linkClass}>History</NavLink>
                </div>
            </div>
            {/* prism rainbow line */}
            <div className="h-1 w-full bg-gradient-to-r from-red-400 via-yellow-300 via-green-400 via-sky-400 to-violet-500" />
        </nav>
    )
}