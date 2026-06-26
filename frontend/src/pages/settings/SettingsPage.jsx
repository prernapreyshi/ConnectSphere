import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../api/userApi";
import Navbar from "../../components/layout/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [saving, setSaving] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", newP: "", confirm: "" });
  const [pwError, setPwError] = useState("");

  const handleChangePassword = async () => {
    setPwError("");
    if (passwords.newP.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    if (passwords.newP !== passwords.confirm) { setPwError("Passwords do not match"); return; }
    setSaving(true);
    try {
      await api.put("/users/password", { currentPassword: passwords.current, newPassword: passwords.newP });
      toast.success("Password changed! Please log in again.");
      setTimeout(() => logout(), 1500);
    } catch (err) { setPwError(err.response?.data?.message || "Failed to change password"); }
    finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your posts, connections, and messages."
    );
    if (!confirmed) return;
    const doubleConfirm = window.prompt('Type "DELETE" to confirm account deletion:');
    if (doubleConfirm !== "DELETE") { toast.error("Deletion cancelled"); return; }
    try {
      await api.delete("/users/account");
      logout();
      toast.success("Account deleted");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete account"); }
  };

  const tabs = [
    { id: "account", label: "Account" },
    { id: "privacy", label: "Privacy" },
    { id: "danger", label: "Danger zone" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="flex gap-6">
          {/* Tab sidebar */}
          <aside className="w-44 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${activeTab === t.id ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-4">
            {activeTab === "account" && (
              <>
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Account information</h2>
                  <div className="space-y-3 text-sm">
                    {[["Name", user?.name], ["Username", `@${user?.username}`], ["Email", user?.email],
                      ["Member since", new Date(user?.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })]
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Change password</h2>
                  <div className="space-y-3">
                    {[
                      { label: "Current password", id: "current", key: "current" },
                      { label: "New password", id: "newP", key: "newP" },
                      { label: "Confirm new password", id: "confirm", key: "confirm" },
                    ].map(({ label, id, key }) => (
                      <div key={id}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                        <input type="password" value={passwords[key]}
                          onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                          className="input text-sm" />
                      </div>
                    ))}
                    {pwError && <p className="text-red-500 text-xs">{pwError}</p>}
                    <button onClick={handleChangePassword} disabled={saving}
                      className="btn-primary text-sm py-2">
                      {saving ? "Saving…" : "Change password"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "privacy" && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Privacy settings</h2>
                <div className="space-y-4">
                  {[
                    { label: "Public profile", desc: "Anyone can view your profile", defaultOn: true },
                    { label: "Show email", desc: "Display your email on your profile", defaultOn: false },
                    { label: "Show connections", desc: "Let others see your connections list", defaultOn: true },
                    { label: "Email notifications", desc: "Receive email for likes, comments, and connections", defaultOn: true },
                  ].map(({ label, desc, defaultOn }) => {
                    const [on, setOn] = useState(defaultOn);
                    return (
                      <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                        <button onClick={() => { setOn(!on); toast.success("Preference saved"); }}
                          className={`relative w-10 h-6 rounded-full transition-colors ${on ? "bg-brand-600" : "bg-gray-200"}`}>
                          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${on ? "translate-x-4" : ""}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "danger" && (
              <div className="card p-6 border-red-200">
                <h2 className="font-semibold text-red-600 mb-2">Danger zone</h2>
                <p className="text-sm text-gray-500 mb-6">
                  These actions are permanent and cannot be undone.
                </p>
                <div className="border border-red-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Delete account</p>
                      <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account, posts, and all data</p>
                    </div>
                    <button onClick={handleDeleteAccount}
                      className="text-sm font-medium text-red-500 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0 ml-4">
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
