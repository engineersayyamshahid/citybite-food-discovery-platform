import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Round back button. Goes to the previous page, or to `fallback` if there is none. */
export default function BackButton({ fallback = '/home', onClick, className = '' }) {
  const navigate = useNavigate();
  const go = () => {
    if (onClick) return onClick();
    if (window.history.length > 1) navigate(-1);
    else navigate(fallback);
  };
  return (
    <button type="button" className={`icon-btn back-btn ${className}`} onClick={go} aria-label="Go back">
      <ChevronLeft size={22} />
    </button>
  );
}
