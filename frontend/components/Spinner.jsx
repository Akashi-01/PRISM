export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-3 text-gray-600">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
      <span>{label}</span>
    </div>
  )
}