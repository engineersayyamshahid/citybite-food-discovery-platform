import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ScrollToTop from './components/layout/ScrollToTop';
import PageLoader from './components/loaders/PageLoader';

// Pages are loaded only when needed (lazy) so the first load stays fast
const Landing = lazy(() => import('./pages/Landing'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const VerifyOtp = lazy(() => import('./pages/auth/VerifyOtp'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const LocationPermission = lazy(() => import('./pages/auth/LocationPermission'));
const TastePicker = lazy(() => import('./pages/auth/TastePicker'));
const ChooseArea = lazy(() => import('./pages/auth/ChooseArea'));

// customer screens
const Home = lazy(() => import('./pages/customer/Home'));
const Explore = lazy(() => import('./pages/customer/Explore'));
const Search = lazy(() => import('./pages/customer/Search'));
const Results = lazy(() => import('./pages/customer/Results'));
const Favorites = lazy(() => import('./pages/customer/Favorites'));
const RestaurantDetail = lazy(() => import('./pages/customer/RestaurantDetail'));
const FoodDetail = lazy(() => import('./pages/customer/FoodDetail'));
const DishReviews = lazy(() => import('./pages/customer/DishReviews'));
const Reviews = lazy(() => import('./pages/customer/Reviews'));
const AddReview = lazy(() => import('./pages/customer/AddReview'));
const RateDishes = lazy(() => import('./pages/customer/RateDishes'));
const Profile = lazy(() => import('./pages/customer/Profile'));

// restaurant screens
const GenerateBill = lazy(() => import('./pages/restaurant/GenerateBill'));
const BillGenerated = lazy(() => import('./pages/restaurant/BillGenerated'));
const BillHistory = lazy(() => import('./pages/restaurant/BillHistory'));
const Menu = lazy(() => import('./pages/restaurant/Menu'));
const EditDish = lazy(() => import('./pages/restaurant/EditDish'));
const RestaurantReviews = lazy(() => import('./pages/restaurant/RestaurantReviews'));
const RestaurantProfile = lazy(() => import('./pages/restaurant/RestaurantProfile'));
const Settings = lazy(() => import('./pages/restaurant/Settings'));
const RestaurantDetails = lazy(() => import('./pages/restaurant/RestaurantDetails'));
const OpeningHours = lazy(() => import('./pages/restaurant/OpeningHours'));
const Promote = lazy(() => import('./pages/restaurant/Promote'));
const Promotion = lazy(() => import('./pages/restaurant/Promotion'));

/** All the routes (URLs) of the app in one place */
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-center"
        toastOptions={{ style: { background: '#221d17', color: '#fdfbf6', borderRadius: 14, fontSize: 14 }, success: { iconTheme: { primary: '#e2632f', secondary: '#fdfbf6' } } }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* public pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding/location" element={<LocationPermission />} />
          <Route path="/onboarding/taste" element={<TastePicker />} />
          <Route path="/onboarding/area" element={<ChooseArea />} />

          {/* customer area */}
          <Route element={<AppShell role="customer" />}>
            <Route path="/home" element={<ProtectedRoute role="customer"><Home /></ProtectedRoute>} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/search" element={<Search />} />
            <Route path="/results" element={<Results />} />
            <Route path="/favorites" element={<ProtectedRoute role="customer"><Favorites /></ProtectedRoute>} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/dish/:id" element={<FoodDetail />} />
            <Route path="/dish/:id/reviews" element={<DishReviews />} />
            <Route path="/reviews" element={<ProtectedRoute role="customer"><Reviews /></ProtectedRoute>} />
            <Route path="/reviews/add" element={<ProtectedRoute role="customer"><AddReview /></ProtectedRoute>} />
            <Route path="/reviews/rate/:code" element={<ProtectedRoute role="customer"><RateDishes /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute role="customer"><Profile /></ProtectedRoute>} />
          </Route>

          {/* restaurant area */}
          <Route element={<ProtectedRoute role="restaurant_owner"><AppShell role="restaurant_owner" /></ProtectedRoute>}>
            <Route path="/r" element={<Navigate to="/r/bill" replace />} />
            <Route path="/r/bill" element={<GenerateBill />} />
            <Route path="/r/bills" element={<BillHistory />} />
            <Route path="/r/bill/:id" element={<BillGenerated />} />
            <Route path="/r/menu" element={<Menu />} />
            <Route path="/r/menu/new" element={<EditDish />} />
            <Route path="/r/menu/:id/edit" element={<EditDish />} />
            <Route path="/r/reviews" element={<RestaurantReviews />} />
            <Route path="/r/profile" element={<RestaurantProfile />} />
            <Route path="/r/settings" element={<Settings />} />
            <Route path="/r/settings/details" element={<RestaurantDetails />} />
            <Route path="/r/settings/hours" element={<OpeningHours />} />
            <Route path="/r/promote" element={<Promote />} />
            <Route path="/r/promotion" element={<Promotion />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
