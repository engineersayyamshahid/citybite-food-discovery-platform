import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useLocalStorage from '../hooks/useLocalStorage';
import { browseService } from '../services/browseService';
import { meService } from '../services/meService';
import { myRestaurantService } from '../services/myRestaurantService';
import { ROLES } from '../utils/constants';

export const AppContext = createContext(null);

const EMPTY_FAVS = { dishes: new Set(), restaurants: new Set() };

/**
 * Shared data that many screens need:
 *  - areas + cuisines (public lists used by filters, sign up, pickers)
 *  - profile + area of the logged in customer
 *  - favourite ids (so hearts are filled everywhere)
 *  - the restaurant of a logged in owner
 *  - recent searches (kept in the browser only)
 * Everything else is loaded by each page from the API.
 */
export function AppProvider({ children }) {
  const { user } = useAuth();
  const isCustomer = user?.role === ROLES.customer;
  const isOwner = user?.role === ROLES.owner;

  const [areas, setAreas] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [profile, setProfile] = useState(null);
  const [favs, setFavs] = useState(EMPTY_FAVS);
  const [myRestaurant, setMyRestaurant] = useState(null);
  const [recent, setRecent] = useLocalStorage('cb_recent', []);

  // areas and cuisines are public lists - load once
  useEffect(() => {
    browseService.areas().then(setAreas).catch(() => {});
    browseService.cuisines().then(setCuisines).catch(() => {});
  }, []);

  // customer: profile + favourites
  useEffect(() => {
    if (!isCustomer) { setProfile(null); setFavs(EMPTY_FAVS); return; }
    meService.profile().then(setProfile).catch(() => {});
    meService.favorites()
      .then((f) => setFavs({ dishes: new Set(f.dishes.map((d) => d.dishId)), restaurants: new Set(f.restaurants.map((r) => r.restaurantId)) }))
      .catch(() => {});
  }, [isCustomer, user?.userId]);

  // restaurant owner: the restaurant
  const refreshMyRestaurant = useCallback(() => myRestaurantService.get().then((r) => { setMyRestaurant(r); return r; }), []);
  useEffect(() => {
    if (!isOwner) { setMyRestaurant(null); return; }
    refreshMyRestaurant().catch(() => {});
  }, [isOwner, user?.userId, refreshMyRestaurant]);

  /* ---------- favourites (heart buttons) ---------- */
  const isFav = useCallback((kind, id) => favs[kind].has(id), [favs]);

  // fills/empties the heart right away, then tells the backend (and undoes it if the request fails)
  const toggleFav = useCallback(async (kind, id) => {
    const had = favs[kind].has(id);
    const flip = (on) => setFavs((prev) => {
      const next = new Set(prev[kind]);
      if (on) next.add(id); else next.delete(id);
      return { ...prev, [kind]: next };
    });
    flip(!had);
    try {
      if (had) await meService.removeFavorite(kind, id);
      else await meService.addFavorite(kind, id);
    } catch (e) {
      flip(had);
      throw e;
    }
    return !had;
  }, [favs]);

  /* ---------- area ---------- */
  const setArea = useCallback(async (areaId) => {
    const p = await meService.setArea(areaId);
    setProfile(p);
    return p;
  }, []);
  const area = useMemo(() => {
    const a = areas.find((x) => x.areaId === profile?.areaId);
    return a || (profile?.areaName ? { areaId: profile.areaId, name: profile.areaName, city: 'Multan' } : null);
  }, [areas, profile]);

  /* ---------- recent searches ---------- */
  const addRecent = useCallback((q) => {
    const term = q.trim().toLowerCase();
    if (!term) return;
    setRecent((prev) => [term, ...prev.filter((x) => x !== term)].slice(0, 6));
  }, [setRecent]);
  const removeRecent = useCallback((q) => setRecent((prev) => prev.filter((x) => x !== q)), [setRecent]);
  const clearRecent = useCallback(() => setRecent([]), [setRecent]);

  const value = {
    areas, cuisines, area, profile, setProfile, setArea,
    favs, isFav, toggleFav,
    myRestaurant, setMyRestaurant, refreshMyRestaurant,
    recent, addRecent, removeRecent, clearRecent,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
