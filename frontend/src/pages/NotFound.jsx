import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';

/** Shown for any address that doesn't exist */
export default function NotFound() {
  return (
    <div className="center-screen">
      <EmptyState icon={SearchX} title="Page not found" text="The page you are looking for does not exist or was moved." action={<Link to="/" className="btn btn-primary">Back to CityBite</Link>} />
    </div>
  );
}
