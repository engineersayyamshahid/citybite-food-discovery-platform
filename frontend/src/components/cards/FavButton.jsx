import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useApp from '../../hooks/useApp';
import useAuth from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

/**
 * Heart button for dishes and restaurants (saved in the database for the logged in customer).
 * kind = 'dishes' | 'restaurants'. Pops when you tap it.
 */
export default function FavButton({ kind, id, variant = 'plain', className = '' }) {
  const { isFav, toggleFav } = useApp();
  const { user } = useAuth();
  const active = isFav(kind, id);

  const click = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast('Log in to save favourites', { icon: '🔒' });
    if (user.role !== ROLES.customer) return toast('Only customers can save favourites');
    try {
      const nowOn = await toggleFav(kind, id);
      toast.success(nowOn ? 'Saved to favorites' : 'Removed from favorites', { duration: 1600 });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <motion.button
      type="button" className={`fav-btn fav-${variant} ${active ? 'on' : ''} ${className}`}
      onClick={click} whileTap={{ scale: 0.8 }} animate={{ scale: active ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }}
      aria-pressed={active} aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart size={20} fill={active ? 'currentColor' : 'none'} />
    </motion.button>
  );
}
