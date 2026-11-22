import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

// Shortcut for the shared app data (restaurants, dishes, reviews, favourites...)
export default function useApp() {
  return useContext(AppContext);
}
