import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';

/**
 * "Find food near you" screen.
 * The backend works with a list of areas (no GPS), so after the browser permission
 * the person picks the closest area from the list.
 */
export default function LocationPermission() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const toArea = () => navigate('/onboarding/area', { state: { next: '/onboarding/taste' } });

  const allow = () => {
    if (!navigator.geolocation) return toArea();
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => { setLoading(false); toast.success('Thanks! Now pick the area closest to you.'); toArea(); },
      () => { setLoading(false); toast('Location was blocked. Choose your area from the list.'); toArea(); },
      { timeout: 8000 }
    );
  };

  return (
    <div className="center-screen">
      <motion.div className="pin-art" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="pin-ring"><div className="pin-inner"><MapPin size={44} /></div></div>
      </motion.div>
      <h1 className="h-serif">Find food near you</h1>
      <p className="muted">Allow location access to see the best-rated restaurants and dishes near you.</p>
      <div className="stack full">
        <Button block onClick={allow} loading={loading}>Allow location</Button>
        <Link to="/onboarding/area" state={{ next: '/onboarding/taste' }} className="btn btn-ghost btn-block">Choose your area manually</Link>
      </div>
    </div>
  );
}
