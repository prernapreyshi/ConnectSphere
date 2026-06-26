import Navbar from "../../components/layout/Navbar";
import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getExplorePosts } from "../../api/postApi";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import PostCard from "../../components/post/PostCard";
import Avatar from "../../components/common/Avatar";

export default function ExplorePage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const tag = params.get("tag");

  const fetchFn = useCallback((cursor) => getExplorePosts(cursor, tag), [tag]);
  const { posts, loading, hasMore, initialLoaded, loaderRef, remove } = useInfiniteScroll(fetchFn);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {!initialLoaded ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500">{tag ? `No posts with #${tag} yet` : "Nothing to explore yet"}</p>
          </div>
        ) : (
          <>
            {posts.map((post) => <PostCard key={post._id} post={post} onDelete={remove} />)}
            <div ref={loaderRef} className="py-4 flex justify-center">
              {loading && <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />}
              {!hasMore && <p className="text-xs text-gray-400">That's everything ✓</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
