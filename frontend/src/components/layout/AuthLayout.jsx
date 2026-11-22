import { motion } from 'framer-motion';
import BackButton from '../common/BackButton';
import Logo from '../common/Logo';
import images from '../../assets/images';

/**
 * Frame for login / signup / OTP screens.
 * Phones: simple white form like the mockups. Desktop: form on the right, food photo panel on the left.
 */
export default function AuthLayout({ children, back = true, backTo = '/', badge }) {
  return (
    <div className="auth">
      <aside className="auth-art" aria-hidden="true">
        <Logo light to="/" />
        <h2 className="h-serif">Find it. Eat it.<br />Rate it honestly.</h2>
        <p>Top-rated dishes and restaurants near you. Reviews come only from real bills.</p>
        <div className="auth-photos">
          <img src={images.dishes['chicken-karahi']} alt="" />
          <img src={images.dishes['cheese-lovers-pizza']} alt="" />
          <img src={images.dishes['seekh-kabab']} alt="" />
        </div>
      </aside>
      <motion.section className="auth-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="auth-form">
          {back && <BackButton fallback={backTo} className="auth-back" />}
          {badge}
          {children}
        </div>
      </motion.section>
    </div>
  );
}
