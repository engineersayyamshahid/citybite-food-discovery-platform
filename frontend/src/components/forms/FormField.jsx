import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Label + input + error message in one component.
 * type="password" automatically gets a show/hide eye button.
 * `icon` shows a small icon on the left (used for location).
 * `options` ([{ value, label }]) turns it into a dropdown (used for area / food type).
 */
export default function FormField({ label, error, type = 'text', icon: Icon, textarea = false, options, hint, className = '', ...rest }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  const Tag = options ? 'select' : textarea ? 'textarea' : 'input';
  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className={`input-wrap ${error ? 'has-error' : ''} ${Icon ? 'has-icon' : ''}`}>
        {Icon && <Icon size={18} className="input-icon" />}
        <Tag
          id={id} className={`input ${options ? 'select' : ''}`} type={options || textarea ? undefined : isPass && show ? 'text' : type}
          aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...rest}
        >
          {options && options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Tag>
        {isPass && (
          <button type="button" className="input-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error" id={`${id}-err`} role="alert">{error}</p>}
    </div>
  );
}
