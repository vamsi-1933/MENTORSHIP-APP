export default function StatsCard({ title, value, tone = "sky" }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <p className="stat-card__label">{title}</p>
      <h2 className="stat-card__value">{value ?? 0}</h2>
    </div>
  );
}
