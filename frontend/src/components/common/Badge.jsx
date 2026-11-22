import { BadgeCheck } from 'lucide-react';

/** Small label: variant = sponsored | verified | rank | rank-soft | green | gray */
export default function Badge({ variant = 'gray', children, icon }) {
  return (
    <span className={`badge badge-${variant}`}>
      {variant === 'verified' && !icon && <BadgeCheck size={12} />}
      {children}
    </span>
  );
}
