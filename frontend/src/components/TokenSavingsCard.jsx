import Section from "./Section";

export default function TokenSavingsCard({ before, after, saved, percent }) {
  const positive = saved > 0;
  const color = positive ? "text-green-600" : "text-amber-600";

  return (
    <Section title="Token savings">
      <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
        <Stat label="Before" value={before} />
        <Stat label="After" value={after} />
        <Stat label="Saved" value={saved} className={color} />
        <Stat label="% saved" value={`${Number(percent).toFixed(1)}%`} className={color} big />
      </div>
      {!positive && (
        <p className="mt-3 text-sm text-amber-700">
          No token reduction on this run. The optimizer added clarity instead of cutting length.
        </p>
      )}
    </Section>
  );
}

function Stat({ label, value, className = "text-gray-900", big }) {
  return (
    <div>
      <div className={`${big ? "text-4xl" : "text-2xl"} font-bold ${className}`}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  );
}