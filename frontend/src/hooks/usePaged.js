import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * For lists that come in pages ({ items, total, page, pageSize }).
 * Loads page 1, and `loadMore()` adds the next page to the end of the list.
 *
 *   const list = usePaged((page) => browseService.dishes(filters, { page }), [filters]);
 */
export default function usePaged(fetchPage, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ items: [], total: 0, page: 0, loading: enabled, loadingMore: false, error: null });
  const run = useRef(0);
  const fnRef = useRef(fetchPage);
  fnRef.current = fetchPage;

  useEffect(() => {
    if (!enabled) { setState({ items: [], total: 0, page: 0, loading: false, loadingMore: false, error: null }); return undefined; }
    const id = ++run.current;
    setState((s) => ({ ...s, items: [], total: 0, page: 0, loading: true, error: null }));
    fnRef.current(1)
      .then((r) => { if (id === run.current) setState({ items: r.items, total: r.total, page: 1, loading: false, loadingMore: false, error: null }); })
      .catch((error) => { if (id === run.current) setState((s) => ({ ...s, loading: false, error })); });
    return () => { run.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  const loadMore = useCallback(async () => {
    const id = run.current;
    setState((s) => ({ ...s, loadingMore: true }));
    try {
      const r = await fnRef.current(state.page + 1);
      if (id === run.current) setState((s) => ({ ...s, items: [...s.items, ...r.items], total: r.total, page: s.page + 1, loadingMore: false }));
    } catch (error) {
      if (id === run.current) setState((s) => ({ ...s, loadingMore: false, error }));
    }
  }, [state.page]);

  const hasMore = state.items.length < state.total;
  const reload = useCallback(() => {
    run.current += 1;
    const id = run.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current(1)
      .then((r) => { if (id === run.current) setState({ items: r.items, total: r.total, page: 1, loading: false, loadingMore: false, error: null }); })
      .catch((error) => { if (id === run.current) setState((s) => ({ ...s, loading: false, error })); });
  }, []);

  return { ...state, hasMore, loadMore, reload };
}
