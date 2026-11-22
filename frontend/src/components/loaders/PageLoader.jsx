import { Utensils } from 'lucide-react';

/** Full screen loader (first visit). Fork and knife bounce on an orange ring. */
export default function PageLoader({ text = 'Finding good food...' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="loader-ring">
        <Utensils size={34} className="loader-icon" />
      </div>
      <p className="muted">{text}</p>
    </div>
  );
}
