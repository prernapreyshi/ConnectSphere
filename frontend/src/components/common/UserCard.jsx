import { useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import { sendConnectionRequest, toggleFollow } from "../../api/userApi";
import toast from "react-hot-toast";

export default function UserCard({ user, showFollow = false }) {
  const [connected, setConnected] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await sendConnectionRequest(user._id);
      setConnected(true);
      toast.success("Connection request sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally { setLoading(false); }
  };

  const handleFollow = async () => {
    setLoading(true);
    try {
      const { data } = await toggleFollow(user._id);
      setFollowed(data.following);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="card p-4 flex items-start gap-3">
      <Link to={`/profile/${user.username}`}>
        <Avatar src={user.avatar} name={user.name} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${user.username}`} className="hover:underline">
          <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
        </Link>
        <p className="text-xs text-gray-500 truncate">{user.headline || "ConnectSphere member"}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {user.connections?.length || 0} connections
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {!connected ? (
          <button onClick={handleConnect} disabled={loading} className="btn-secondary text-xs py-1 px-3">
            Connect
          </button>
        ) : (
          <span className="text-xs text-green-600 font-medium">Sent ✓</span>
        )}
        {showFollow && (
          <button onClick={handleFollow} disabled={loading}
            className={`text-xs py-1 px-3 rounded-lg border transition-colors ${
              followed ? "bg-gray-100 text-gray-600 border-gray-300" : "text-brand-600 border-brand-500 hover:bg-brand-50"
            }`}>
            {followed ? "Following" : "Follow"}
          </button>
        )}
      </div>
    </div>
  );
}
