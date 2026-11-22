import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async function (an API call) and gives back { data, loading, error, reload, setData }.
 * It runs again whenever something in `deps` changes. Old results are ignored if a newer call started.
 *
 *   const { data, loading, error, reload } = useAsync(() => browseService.dish(id), [id]);
 *
 * Pass `enabled: false` to wait (for example until a user is logged in).
 */
export default function useAsync(fn, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const run = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const load = useCallback(() => {
    const id = ++run.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current()
      .then((data) => { if (id === run.current) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (id === run.current && error.name !== 'AbortError') setState((s) => ({ data: s.data, loading: false, error })); });
  }, []);

  useEffect(() => {
    if (!enabled) { setState({ data: null, loading: false, error: null }); return undefined; }
    load();
    return () => { run.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: load, setData };
}
