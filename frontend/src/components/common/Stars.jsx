import { Star } from 'lucide-react';

/** Read-only row of 5 stars. `value` can be a decimal like 4.6 (rounded to the nearest star). */
export default function Stars({ value = 0, size = 14, className = '' }) {
  const rounded = Math.round(value);
  return (
    <span className={`stars ${className}`} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= rounded ? 'star-on' : 'star-off'} />
      ))}
    </span>
  );
}

/** Small orange star + number, like "★ 4.8" */
export function RatingText({ value, count, size = 13 }) {
  return (
    <span className="rating-text">
      <Star size={size} className="star-on" />
      <b>{Number(value).toFixed(1)}</b>
      {count !== undefined && <span className="muted"> ({count})</span>}
    </span>
  );
}
