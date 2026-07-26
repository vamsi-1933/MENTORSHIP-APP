export default function DashboardHeader({ title, subtitle }) {
  return (
    <div className="dash-header">
      <h1 className="dash-header__title">{title}</h1>
      {subtitle ? <p className="dash-header__subtitle">{subtitle}</p> : null}
    </div>
  );
}
