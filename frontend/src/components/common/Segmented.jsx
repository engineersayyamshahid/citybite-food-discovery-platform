import { motion } from 'framer-motion';
import { useId } from 'react';

/** Segmented tabs (Customer | Restaurant, Dishes | Restaurants, 7 days | 14 days ...). */
export default function Segmented({ options, value, onChange, className = '' }) {
  const id = useId();
  return (
    <div className={`seg ${className}`} role="tablist">
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        const active = opt.value === value;
        return (
          <button key={opt.value} role="tab" aria-selected={active} className={`seg-item ${active ? 'on' : ''}`} onClick={() => onChange(opt.value)} type="button">
            {active && <motion.span layoutId={`seg-${id}`} className="seg-pill" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
            <span className="seg-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
