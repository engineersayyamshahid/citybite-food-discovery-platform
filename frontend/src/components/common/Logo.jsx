import { Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

/** CityBite logo: orange fork-and-knife icon with the serif wordmark */
export default function Logo({ size = 'md', stacked = false, to = '/', light = false }) {
  const icon = size === 'lg' ? 44 : size === 'sm' ? 20 : 26;
  return (
    <Link to={to} className={`logo logo-${size} ${stacked ? 'logo-stacked' : ''} ${light ? 'logo-light' : ''}`} aria-label="CityBite home">
      <Utensils size={icon} strokeWidth={2.2} />
      <span className="logo-word">CityBite</span>
    </Link>
  );
}
