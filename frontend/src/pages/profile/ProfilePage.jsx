import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import {
  getProfile, updateAvatar, removeAvatar,
  sendConnectionRequest, toggleFollow, downloadResume,
} from "../../api/userApi";
import Avatar from "../../components/common/Avatar";
import EditProfileModal from "../../components/profile/EditProfileModal";
import ExperienceModal from "../../components/profile/ExperienceModal";
import PostCard from "../../components/post/PostCard";
import { getUserPosts } from "../../api/postApi";
import { useCallback } from "react";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const isOwn = me?.username === username;
  const navigate = useNavigate();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => getProfile(username).then((r) => r.data.user),
  });

  const connectMutation = useMutation({
    mutationFn: () => sendConnectionRequest(data._id),
    onSuccess: () => { toast.success("Connection request sent!"); qc.invalidateQueries(["profile", username]); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const followMutation = useMutation({
    mutationFn: () => toggleFollow(data._id),
    onSuccess: (res) => { toast.success(res.data.message); qc.invalidateQueries(["profile", username]); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      await updateAvatar(formData);
      toast.success("Avatar updated!");
      qc.invalidateQueries(["profile", username]);
    } catch { toast.error("Upload failed"); }
  };

  const handleDownloadResume = async () => {
    setDownloadingPdf(true);
    try {
      const res = await downloadResume(username);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = `${username}-resume.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Resume downloaded!");
    } catch { toast.error("Failed to generate resume"); }
    finally { setDownloadingPdf(false); }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (isError) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><p className="text-gray-500 mb-4">User not found</p>
        <Link to="/feed" className="btn-primary">Back to feed</Link></div>
    </div>
  );

  const user = data;
  const isConnected = user.connections?.some((c) => c._id === me?._id);
  const isFollowing = user.followers?.some((f) => f._id === me?._id);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Present";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Profile Card */}
        <div className="card overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-brand-600 to-blue-400" />

          <div className="px-6 pb-6">
            {/* Avatar + actions row */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                <Avatar src={user.avatar} name={user.name} size="xl" />
                {isOwn && (
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors" title="Change avatar">
                    <span className="text-xs">📷</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button onClick={handleDownloadResume} disabled={downloadingPdf}
                  className="flex items-center gap-1.5 text-sm border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60">
                  {downloadingPdf ? "Generating…" : "⬇ Resume"}
                </button>

                {isOwn ? (
                  <button onClick={() => setShowEditModal(true)} className="btn-secondary text-sm py-1.5 px-4">
                    Edit profile
                  </button>
                ) : (
                  <>
                    {!isConnected && (
                      <button onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending}
                        className="btn-primary text-sm py-1.5 px-4">
                        {connectMutation.isPending ? "Sending…" : "🤝 Connect"}
                      </button>
                    )}
                    <button onClick={() => navigate(`/messages?userId=${user._id}`)}
                      className="btn-secondary text-sm py-1.5 px-4">
                      💬 Message
                    </button>
                    <button onClick={() => followMutation.mutate()} disabled={followMutation.isPending}
                      className={`text-sm py-1.5 px-4 rounded-lg border transition-colors ${
                        isFollowing ? "border-gray-300 text-gray-600 hover:bg-gray-50"
                          : "border-brand-500 text-brand-600 hover:bg-brand-50"}`}>
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Name & headline */}
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            {user.headline && <p className="text-gray-600 mt-1">{user.headline}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
              {user.location && <span>📍 {user.location}</span>}
              {user.website && <a href={user.website} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">🔗 {user.website}</a>}
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100 text-sm">
              {[
                { label: "connections", val: user.connections?.length || 0 },
                { label: "followers", val: user.followers?.length || 0 },
                { label: "following", val: user.following?.length || 0 },
              ].map(({ label, val }) => (
                <div key={label}>
                  <span className="font-semibold text-gray-900">{val}</span>
                  <span className="text-gray-500 ml-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="card overflow-hidden">
          <div className="flex border-b border-gray-100">
            {["about", "posts", "experience", "education", "connections"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab ? "text-brand-600 border-b-2 border-brand-600 bg-brand-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* About Tab */}
            {activeTab === "about" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  {user.bio ? <p className="text-gray-600 text-sm leading-relaxed">{user.bio}</p>
                    : <p className="text-gray-400 text-sm italic">No bio yet</p>}
                </div>
                {user.skills?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((s) => (
                        <span key={s} className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Posts Tab */}
            {activeTab === "posts" && (
              <ProfilePostsTab username={username} />
            )}

            {/* Experience Tab */}
            {activeTab === "experience" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Experience</h3>
                  {isOwn && <button onClick={() => setShowExpModal(true)} className="text-brand-600 text-sm hover:underline">+ Add</button>}
                </div>
                {user.experience?.length ? (
                  <div className="space-y-4">
                    {user.experience.map((e, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">🏢</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{e.title}</p>
                          <p className="text-sm text-gray-600">{e.company}</p>
                          <p className="text-xs text-gray-400">{formatDate(e.startDate)} – {e.current ? "Present" : formatDate(e.endDate)}</p>
                          {e.description && <p className="text-sm text-gray-500 mt-1">{e.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-400 text-sm italic">No experience added yet</p>}
              </div>
            )}

            {/* Education Tab */}
            {activeTab === "education" && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Education</h3>
                {user.education?.length ? (
                  <div className="space-y-4">
                    {user.education.map((e, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">🎓</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{e.school}</p>
                          <p className="text-sm text-gray-600">{e.degree}{e.field ? ` · ${e.field}` : ""}</p>
                          <p className="text-xs text-gray-400">{e.startYear} – {e.endYear || "Present"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-400 text-sm italic">No education added yet</p>}
              </div>
            )}

            {/* Connections Tab */}
            {activeTab === "connections" && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Connections <span className="text-gray-400 font-normal text-sm ml-1">({user.connections?.length || 0})</span>
                </h3>
                {user.connections?.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {user.connections.map((c) => (
                      <Link key={c._id} to={`/profile/${c.username}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Avatar src={c.avatar} name={c.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{c.name}</p>
                          <p className="text-xs text-gray-500 truncate">{c.headline || ""}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : <p className="text-gray-400 text-sm italic">No connections yet</p>}
              </div>
            )}
          </div>
        </div>
      </main>

      {showEditModal && <EditProfileModal onClose={() => setShowEditModal(false)} />}
      {showExpModal && <ExperienceModal onClose={() => setShowExpModal(false)} />}
    </div>
  );
}

function ProfilePostsTab({ username }) {
  const { user: me } = useAuth();
  const fetchFn = useCallback((cursor) => getUserPosts(username, cursor), [username]);
  const { posts, loading, initialLoaded, hasMore, loaderRef, remove } = useInfiniteScroll(fetchFn);

  if (!initialLoaded) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (posts.length === 0) return <p className="text-gray-400 text-sm italic text-center py-6">No posts yet</p>;

  return (
    <div className="space-y-4">
      {posts.map((post) => <PostCard key={post._id} post={post} onDelete={remove} />)}
      <div ref={loaderRef} className="py-2 flex justify-center">
        {loading && <div className="w-5 h-5 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />}
        {!hasMore && posts.length > 4 && <p className="text-xs text-gray-400">All posts loaded ✓</p>}
      </div>
    </div>
  );
}
