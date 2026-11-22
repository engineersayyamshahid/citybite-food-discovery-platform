import { Search, X } from 'lucide-react';

/** Search input with an icon and a clear (x) button */
export default function SearchBar({ value, onChange, placeholder = 'Search dishes or restaurants', onSubmit, autoFocus = false, onFocus, className = '' }) {
  return (
    <form className={`searchbar ${className}`} role="search" onSubmit={(e) => { e.preventDefault(); onSubmit && onSubmit(value); }}>
      <Search size={18} className="searchbar-icon" />
      <input
        type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        autoFocus={autoFocus} onFocus={onFocus} aria-label={placeholder} enterKeyHint="search"
      />
      {value && (
        <button type="button" className="searchbar-clear" onClick={() => onChange('')} aria-label="Clear search"><X size={16} /></button>
      )}
    </form>
  );
}
