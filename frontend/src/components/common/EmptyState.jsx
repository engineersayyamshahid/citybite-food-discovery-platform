import { motion } from 'framer-motion';

/** Friendly "nothing here" message with an icon and optional button */
export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <motion.div className="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {Icon && <div className="empty-icon"><Icon size={30} /></div>}
      <h3 className="h-serif">{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </motion.div>
  );
}
