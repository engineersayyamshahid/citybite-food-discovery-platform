import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Main button used everywhere.
 * variant: primary (orange) | outline | dark | ghost | danger
 * Shows a spinner when `loading` and is disabled while loading.
 */
export default function Button({ variant = 'primary', block = false, size = 'md', loading = false, disabled, children, className = '', icon: Icon, ...rest }) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={`btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={18} className="spin" /> : Icon ? <Icon size={18} /> : null}
      {children}
    </motion.button>
  );
}
