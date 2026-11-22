import { WifiOff } from 'lucide-react';
import Button from './Button';

/** Shown when an API call fails (server off, wrong address, error from the backend) with a Try again button. */
export default function ErrorState({ error, onRetry, compact = false }) {
  if (!error) return null;
  const offline = error.status === 0;
  return (
    <div className={`error-state ${compact ? 'compact' : ''}`} role="alert">
      <div className="empty-icon"><WifiOff size={26} /></div>
      <h3 className="h-serif">{offline ? 'Server not reachable' : 'Something went wrong'}</h3>
      <p className="muted">{error.message}</p>
      {onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
