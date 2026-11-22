import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Menu, Receipt, Search, Star, Store, X } from 'lucide-react';
import Logo from '../components/common/Logo';
import Footer from '../components/layout/Footer';
import SearchBar from '../components/common/SearchBar';
import SmartImage from '../components/common/SmartImage';
import ErrorState from '../components/common/ErrorState';
import { Skeleton } from '../components/loaders/Skeleton';
import { RatingText } from '../components/common/Stars';
import useAuth from '../hooks/useAuth';
import useApp from '../hooks/useApp';
import useAsync from '../hooks/useAsync';
import { browseService } from '../services/browseService';
import { img } from '../services/apiClient';
import images from '../assets/images';
import { CUISINE_IMAGES, LANDING_CUISINES } from '../data/cuisines';
import { formatPrice } from '../utils/helpers';
import { homeFor } from '../utils/constants';

// floating food pictures around the hero (positions are set in pages.css)
const FLOATERS = [
  { src: images.dishes['chicken-karahi'], cls: 'f1' },
  { src: images.dishes['cheese-lovers-pizza'], cls: 'f2' },
  { src: images.dishes['seekh-kabab'], cls: 'f3' },
  { src: images.dishes['pizza-margherita'], cls: 'f4' },
];

const STEPS = [
  { icon: Search, title: 'Find a dish', text: 'Browse top-rated dishes and restaurants near you, ranked by real customers.' },
  { icon: Store, title: 'Eat at the restaurant', text: 'CityBite is only for finding food. You visit and order at the restaurant.' },
  { icon: Receipt, title: 'Rate with your bill code', text: 'Your printed bill has a code. Enter it to rate the dishes you actually ate.' },
];

/** Public home page of the website. Big hero, how it works, top rated, and sign up buttons. */
export default function Landing() {
  const { user } = useAuth();
  const { cuisines } = useApp();
  // top restaurants and dishes come from the backend (public endpoints, no login needed)
  const topR = useAsync(() => browseService.restaurants({ sort: 'top' }, { pageSize: 4 }), []);
  const topD = useAsync(() => browseService.dishes({ sort: 'top' }, { pageSize: 4 }), []);
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);

  const homePath = user ? homeFor(user) : '/signup?role=customer';
  // the cuisine circles on the landing page (names -> backend ids so the links filter correctly)
  const circles = LANDING_CUISINES.map((name) => ({ name, id: cuisines.find((c) => c.name === name)?.cuisineId }));

  const search = (v) => navigate(`/results?q=${encodeURIComponent(v)}`);

  return (
    <div className="landing">
      {/* ---------- top navigation ---------- */}
      <header className="l-nav">
        <div className="l-nav-in">
          <Logo />
          <nav className={`l-links ${menu ? 'open' : ''}`} aria-label="Website">
            <Link to="/explore" onClick={() => setMenu(false)}>Explore</Link>
            <a href="#how" onClick={() => setMenu(false)}>How it works</a>
            <a href="#top" onClick={() => setMenu(false)}>Top rated</a>
            <Link to="/signup?role=restaurant" onClick={() => setMenu(false)}>For restaurants</Link>
          </nav>
          <div className="l-actions">
            {user ? (
              <Link to={homePath} className="btn btn-primary btn-sm">Open app</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm hide-sm">Log in</Link>
                <Link to="/signup?role=customer" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
            <button className="icon-btn menu-btn" onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>{menu ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="hero">
        {FLOATERS.map((f, i) => (
          <motion.img key={f.cls} src={f.src} alt="" className={`floater ${f.cls}`} aria-hidden="true"
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
            transition={{ opacity: { delay: 0.2 + i * 0.12 }, scale: { delay: 0.2 + i * 0.12, type: 'spring' }, y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' } }} />
        ))}
        <motion.div className="hero-in" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="eyebrow-pill"><BadgeCheck size={14} /> Reviews from real bills only</span>
          <Logo size="lg" stacked to="/" />
          <h1 className="hero-title h-serif">Discover the best food <em>near you</em></h1>
          <p className="hero-sub">Find top-rated dishes and restaurants, ranked by honest customers.</p>
          <div className="hero-search"><SearchBar value={q} onChange={setQ} onSubmit={search} placeholder="Search biryani, karahi, pizza..." /></div>
          <div className="hero-cta">
            <Link to="/signup?role=customer" className="btn btn-light btn-lg">Continue as Customer</Link>
            <Link to="/signup?role=restaurant" className="btn btn-ghost-light btn-lg">Continue as Restaurant</Link>
          </div>
          <p className="hero-login">Already have an account? <Link to="/login">Log in</Link></p>
        </motion.div>
      </section>

      {/* ---------- cuisines ---------- */}
      <section className="l-section">
        <div className="l-wrap">
          <h2 className="h-serif l-title">Browse by cuisine</h2>
          <div className="cuisine-row">
            {circles.map((c, i) => (
              <motion.div key={c.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link to={c.id ? `/results?cuisine=${c.id}` : '/results'} className="cuisine">
                  <SmartImage src={CUISINE_IMAGES[c.name]} alt="" className="cuisine-img" label={c.name} /><span>{c.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="l-section alt" id="how">
        <div className="l-wrap">
          <h2 className="h-serif l-title">How CityBite works</h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <motion.div key={s.title} className="step card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <span className="step-ic"><s.icon size={24} /></span>
                <span className="step-no">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- top rated ---------- */}
      <section className="l-section" id="top">
        <div className="l-wrap">
          <div className="row between end"><h2 className="h-serif l-title">Top rated restaurants</h2><Link to="/explore" className="link-orange">See all <ArrowRight size={14} /></Link></div>
          {topR.error ? <ErrorState error={topR.error} onRetry={topR.reload} compact /> : (
            <div className="grid-4">
              {topR.loading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} h={230} r={20} />) : topR.data.items.map((r) => (
                <Link key={r.restaurantId} to={`/restaurant/${r.restaurantId}`} className="tile hoverable">
                  <SmartImage src={img(r.coverPhotoUrl || r.logoUrl)} alt={r.name} className="tile-img" label={r.name} />
                  <div className="tile-body">
                    <h3>{r.name}</h3>
                    <p className="muted small">{r.cuisines.join(' · ')} · {r.areaName}</p>
                    {r.reviewCount > 0 ? <RatingText value={r.avgRating} count={r.reviewCount} /> : <span className="muted xs">New</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="row between end" style={{ marginTop: 44 }}><h2 className="h-serif l-title">Dishes people love</h2><Link to="/results" className="link-orange">Search dishes <ArrowRight size={14} /></Link></div>
          {topD.error ? <ErrorState error={topD.error} onRetry={topD.reload} compact /> : (
            <div className="grid-4">
              {topD.loading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} h={230} r={20} />) : topD.data.items.map((d) => (
                <Link key={d.dishId} to={`/dish/${d.dishId}`} className="tile hoverable">
                  <SmartImage src={img(d.photoUrl)} alt={d.name} className="tile-img" label={d.name} />
                  <div className="tile-body">
                    <h3>{d.name}</h3>
                    <p className="muted small">{d.restaurantName}</p>
                    <div className="row between"><RatingText value={d.avgRating} /><b className="price">{formatPrice(d.price)}</b></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- verified reviews explainer ---------- */}
      <section className="l-section alt">
        <div className="l-wrap split">
          <div>
            <h2 className="h-serif l-title">Reviews you can trust</h2>
            <p className="muted lead">Every review starts with a printed bill. The restaurant gives you a code, you enter it in the app, and only then you can rate the dishes you ate. No bill, no review.</p>
            <ul className="ticks">
              <li><Star size={16} /> Rate each dish from 1 to 5 stars</li>
              <li><Star size={16} /> Add photos of your food</li>
              <li><Star size={16} /> Reviews carry a "Verified bill" badge</li>
            </ul>
            <Link to="/signup?role=customer" className="btn btn-primary">Start rating <ArrowRight size={16} /></Link>
          </div>
          <div className="code-demo card">
            <p className="eyebrow">Rate your food on CityBite</p>
            <div className="code-boxes">{'H4P9ZD'.split('').map((c, i) => <motion.span key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>{c}</motion.span>)}</div>
            <p className="muted small center">Sample review code printed on a bill</p>
          </div>
        </div>
      </section>

      {/* ---------- restaurant CTA ---------- */}
      <section className="l-section">
        <div className="l-wrap">
          <div className="cta-band">
            <div><h2 className="h-serif">Own a restaurant?</h2><p>Add your menu, create bills with review codes and get found by hungry customers.</p></div>
            <Link to="/signup?role=restaurant" className="btn btn-light btn-lg"><Store size={18} /> List your restaurant</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
