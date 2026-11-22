import { motion } from 'framer-motion';
import Stars from '../common/Stars';

/**
 * Big average number + stars + animated bars for 5 to 1 stars.
 * `breakdown` is what the backend sends: { "5": 90, "4": 30, "3": 10, "2": 3, "1": 1 }
 */
export default function RatingSummary({ rating, total, breakdown = {} }) {
  const sum = [1, 2, 3, 4, 5].reduce((s, k) => s + (breakdown[k] || 0), 0) || 1;
  const rows = [5, 4, 3, 2, 1].map((star) => ({ star, percent: ((breakdown[star] || 0) / sum) * 100 }));
  return (
    <div className="rating-summary card">
      <div className="rs-left">
        <div className="rs-num">{Number(rating).toFixed(1)}</div>
        <Stars value={rating} size={13} />
        <p className="muted small">{total} {total === 1 ? 'review' : 'reviews'}</p>
      </div>
      <div className="rs-bars">
        {rows.map((r) => (
          <div className="rs-row" key={r.star}>
            <span>{r.star}</span>
            <div className="bar"><motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${r.percent}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
