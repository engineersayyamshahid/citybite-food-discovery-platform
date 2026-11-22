import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

/** Website footer - used on the landing page and shown on desktop in the app */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-in">
        <div className="footer-brand">
          <Logo />
          <p className="muted">Discover the best food near you. Honest reviews from real bills.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/explore">Explore food</Link>
          <Link to="/results">Search dishes</Link>
          <Link to="/home">Top rated</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/login">Log in</Link>
          <Link to="/signup?role=customer">Sign up</Link>
          <Link to="/signup?role=restaurant">List your restaurant</Link>
        </div>
        <div>
          <h4>About</h4>
          <p className="muted small">CityBite is only for finding food and rating it. There is no ordering in the app.</p>
        </div>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} CityBite · FYP prototype · Demo data only</p>
    </footer>
  );
}
