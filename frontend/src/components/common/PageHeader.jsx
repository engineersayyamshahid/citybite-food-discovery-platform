import BackButton from './BackButton';

/** Title row with a back button, used at the top of inner screens. */
export default function PageHeader({ title, subtitle, back = true, fallback, right }) {
  return (
    <header className="page-head">
      {back && <BackButton fallback={fallback} />}
      <div className="page-head-text">
        {subtitle && <p className="page-sub">{subtitle}</p>}
        <h1 className="h-serif">{title}</h1>
      </div>
      {right && <div className="page-head-right">{right}</div>}
    </header>
  );
}
