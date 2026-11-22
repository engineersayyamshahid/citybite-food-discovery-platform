import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Tap-to-rate stars (1 to 5). Stars pop when selected and light up on hover.
 * Works with arrow keys too because each star is a real button.
 */
export default function StarInput({ value, onChange, size = 26, label = 'Rating' }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="star-input" role="radiogroup" aria-label={label} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
          whileTap={{ scale: 0.8 }} animate={{ scale: value === n ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.25 }}
          onMouseEnter={() => setHover(n)} onClick={() => onChange(n)}
        >
          <Star size={size} className={n <= shown ? 'star-on' : 'star-off'} />
        </motion.button>
      ))}
    </div>
  );
}
