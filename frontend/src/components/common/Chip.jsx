import { X } from 'lucide-react';

/** Pill used for filters. `on` = selected (dark). `onRemove` shows an x button. */
export default function Chip({ on = false, onClick, onRemove, children, icon: Icon, className = '' }) {
  return (
    <button type="button" className={`chip ${on ? 'on' : ''} ${className}`} onClick={onClick} aria-pressed={on}>
      {Icon && <Icon size={14} />}
      {children}
      {onRemove && (
        <span
          role="button"
          aria-label="Remove filter"
          className="chip-x"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <X size={14} />
        </span>
      )}
    </button>
  );
}
