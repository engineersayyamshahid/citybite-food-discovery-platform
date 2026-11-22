import { useState } from 'react';
import { Utensils } from 'lucide-react';
import { initials } from '../../utils/helpers';

/**
 * <img> that never shows a broken icon.
 * If the picture is missing or fails to load, it shows a soft placeholder instead.
 */
export default function SmartImage({ src, alt = '', className = '', label }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt}>
        {label ? <span>{initials(label)}</span> : <Utensils size={22} />}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
