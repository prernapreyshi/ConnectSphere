import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../api/userApi";
import toast from "react-hot-toast";

export default function EditProfileModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || "", headline: user.headline || "",
    bio: user.bio || "", location: user.location || "",
    website: user.website || "", skills: user.skills?.join(", ") || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean) };
      const { data } = await updateProfile(payload);
      updateUser(data.user);
      toast.success("Profile updated!");
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Update failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {[
            { label: "Full name", id: "name" },
            { label: "Headline", id: "headline" },
            { label: "Location", id: "location" },
            { label: "Website", id: "website", type: "url" },
          ].map(({ label, id, type = "text" }) => (
            <div key={id}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input type={type} value={form[id]}
                onChange={(e) => setForm({ ...form, [id]: e.target.value })} className="input text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">About</label>
            <textarea rows={4} value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="input resize-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Skills <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="React, Node.js, MongoDB…" className="input text-sm" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
