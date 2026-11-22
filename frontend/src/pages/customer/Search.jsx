import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import SearchBar from '../../components/common/SearchBar';
import Chip from '../../components/common/Chip';
import useApp from '../../hooks/useApp';
import { POPULAR_SEARCHES } from '../../data/cuisines';

/** Search screen: recent searches + popular searches. */
export default function Search() {
  const { recent, addRecent, removeRecent, clearRecent, area } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const go = (term) => {
    if (!term.trim()) return;
    addRecent(term);
    navigate(`/results?q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <div className="page narrow-page">
      <div className="search-row">
        <BackButton fallback="/explore" />
        <SearchBar value={q} onChange={setQ} onSubmit={go} autoFocus className="focus" />
      </div>

      {recent.length > 0 && (
        <section>
          <div className="row between"><h2 className="h-serif sub">Recent searches</h2><button type="button" className="link-orange small" onClick={clearRecent}>Clear</button></div>
          {recent.map((t) => (
            <div key={t} className="recent-row">
              <button type="button" className="recent-main" onClick={() => go(t)}><Clock size={18} className="muted" /> {t}</button>
              <button type="button" className="icon-plain" onClick={() => removeRecent(t)} aria-label={`Remove ${t}`}><X size={18} /></button>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="h-serif sub">Popular in {area?.city || 'your city'}</h2>
        <div className="chips-wrap">{POPULAR_SEARCHES.map((t) => <Chip key={t} onClick={() => go(t)}>{t}</Chip>)}</div>
      </section>
    </div>
  );
}
