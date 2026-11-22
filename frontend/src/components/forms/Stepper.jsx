import { Minus, Plus } from 'lucide-react';

/** - 2 + quantity buttons (used on the Generate bill screen) */
export default function Stepper({ value, onChange }) {
  return (
    <div className="stepper">
      <button type="button" className="step-btn" onClick={() => onChange(value - 1)} aria-label="Decrease"><Minus size={16} /></button>
      <span className="step-val" aria-live="polite">{value}</span>
      <button type="button" className="step-btn plus" onClick={() => onChange(value + 1)} aria-label="Increase"><Plus size={16} /></button>
    </div>
  );
}
