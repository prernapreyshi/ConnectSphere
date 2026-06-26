import { useEffect, useRef, useState, useCallback } from "react";

export function useInfiniteScroll(fetchFn) {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const loaderRef = useRef(null);

  const load = useCallback(async (cur = null) => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await fetchFn(cur);
      setPosts((prev) => cur ? [...prev, ...data.posts] : data.posts);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
      setInitialLoaded(true);
    } catch (err) {
      console.error("Feed error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  // Initial load
  useEffect(() => { load(null); }, []);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading && cursor) load(cursor); },
      { threshold: 0.1 }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, cursor, load]);

  const prepend = (post) => setPosts((prev) => [post, ...prev]);
  const remove = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

  return { posts, loading, hasMore, initialLoaded, loaderRef, prepend, remove };
}
