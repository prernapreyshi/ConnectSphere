import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getFeed, getTrendingHashtags } from "../../api/postApi";
import { getSuggestions, searchUsers, getConnectionRequests, respondToConnection } from "../../api/userApi";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import Avatar from "../../components/common/Avatar";
import UserCard from "../../components/common/UserCard";
import CreatePost from "../../components/post/CreatePost";
import PostCard from "../../components/post/PostCard";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function FeedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const fetchFn = useCallback((cursor) => getFeed(cursor), []);
  const { posts, loading, hasMore, initialLoaded, loaderRef, prepend, remove } = useInfiniteScroll(fetchFn);

  const { data: suggestions } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => getSuggestions().then((r) => r.data.users),
    staleTime: 5 * 60 * 1000,
  });

  const { data: requests } = useQuery({
    queryKey: ["connection-requests"],
    queryFn: () => getConnectionRequests().then((r) => r.data.requests),
  });

  const { data: trending } = useQuery({
    queryKey: ["trending"],
    queryFn: () => getTrendingHashtags().then((r) => r.data.hashtags),
    staleTime: 10 * 60 * 1000,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }) => respondToConnection(id, action),
    onSuccess: (_, { action }) => {
      toast.success(action === "accept" ? "Connected!" : "Request declined");
      qc.invalidateQueries(["connection-requests"]);
    },
    onError: () => toast.error("Action failed"),
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQ.trim().length < 2) return;
    setSearching(true);
    try {
      const { data } = await searchUsers(searchQ);
      setSearchResults(data.users);
    } catch { toast.error("Search failed"); }
    finally { setSearching(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {searchResults ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Results for "{searchQ}"</h2>
              <button onClick={() => { setSearchResults(null); setSearchQ(""); }} className="text-sm text-brand-600 hover:underline">Clear</button>
            </div>
            {searching ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : searchResults.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map((u) => <UserCard key={u._id} user={u} showFollow />)}
              </div>
            ) : <div className="card p-12 text-center text-gray-400">No users found</div>}
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Left sidebar */}
            <aside className="w-60 flex-shrink-0 hidden lg:block space-y-3">
              <div className="card overflow-hidden">
                <div className="h-14 bg-gradient-to-r from-brand-600 to-blue-400" />
                <div className="px-4 pb-4">
                  <div className="-mt-6 mb-2"><Avatar src={user?.avatar} name={user?.name} size="lg" /></div>
                  <Link to={`/profile/${user?.username}`} className="font-bold text-sm text-gray-900 hover:underline block">{user?.name}</Link>
                  <p className="text-xs text-gray-500 line-clamp-2">{user?.headline || "Add a headline"}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between"><span>Connections</span><span className="font-semibold text-gray-700">{user?.connections?.length || 0}</span></div>
                    <div className="flex justify-between"><span>Followers</span><span className="font-semibold text-gray-700">{user?.followers?.length || 0}</span></div>
                  </div>
                  <Link to={`/profile/${user?.username}`} className="block mt-3 text-center text-xs text-brand-600 hover:underline font-medium">View profile</Link>
                </div>
              </div>

              {/* Trending hashtags */}
              {trending?.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">Trending</h3>
                  <div className="space-y-2">
                    {trending.slice(0, 6).map((t) => (
                      <Link key={t._id} to={`/explore?tag=${t._id}`}
                        className="flex items-center justify-between text-sm hover:text-brand-600 transition-colors">
                        <span className="text-brand-600 font-medium">#{t._id}</span>
                        <span className="text-xs text-gray-400">{t.count} posts</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* Main feed */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Connection requests */}
              {requests?.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">
                    Connection requests
                    <span className="ml-1 bg-brand-600 text-white text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>
                  </h3>
                  <div className="space-y-3">
                    {requests.map((r) => (
                      <div key={r._id} className="flex items-center gap-3">
                        <Link to={`/profile/${r.from?.username}`}>
                          <Avatar src={r.from?.avatar} name={r.from?.name} size="md" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/profile/${r.from?.username}`} className="font-medium text-sm hover:underline">{r.from?.name}</Link>
                          <p className="text-xs text-gray-500 truncate">{r.from?.headline}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => respondMutation.mutate({ id: r._id, action: "accept" })} className="btn-primary text-xs py-1 px-3">Accept</button>
                          <button onClick={() => respondMutation.mutate({ id: r._id, action: "reject" })} className="btn-secondary text-xs py-1 px-3">Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create post */}
              <CreatePost onCreated={(post) => prepend(post)} />

              {/* Feed posts */}
              {!initialLoaded ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="card p-10 text-center">
                  <div className="text-4xl mb-3">🌐</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Your feed is empty</h3>
                  <p className="text-sm text-gray-500">Connect with people or create your first post!</p>
                </div>
              ) : (
                <>
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} onDelete={remove} />
                  ))}
                  {/* Infinite scroll trigger */}
                  <div ref={loaderRef} className="py-4 flex justify-center">
                    {loading && <div className="w-6 h-6 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />}
                    {!hasMore && posts.length > 0 && <p className="text-xs text-gray-400">You're all caught up ✓</p>}
                  </div>
                </>
              )}
            </div>

            {/* Right sidebar - suggestions */}
            <aside className="w-60 flex-shrink-0 hidden xl:block space-y-3">
              <div className="card p-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-3">People you may know</h3>
                <div className="space-y-3">
                  {suggestions?.slice(0, 4).map((u) => <UserCard key={u._id} user={u} />) || (
                    <p className="text-xs text-gray-400 italic">No suggestions</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
