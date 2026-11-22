import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Works like useState but keeps the value in LocalStorage too,
 * so data is still there after a page refresh.
 * `initial` can be a value or a function that creates the first value.
 */
export default function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) {
      /* broken JSON -> fall back to the initial value */
    }
    return typeof initial === 'function' ? initial() : initial;
  });

  // keep the latest value in a ref so "set" can accept updater functions safely
  const ref = useRef(value);
  ref.current = value;

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage is full or blocked:', key);
    }
  }, [key, value]);

  const set = useCallback((next) => {
    setValue((prev) => (typeof next === 'function' ? next(prev) : next));
  }, []);

  return [value, set];
}
