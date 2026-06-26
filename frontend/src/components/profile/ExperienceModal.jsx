import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../api/userApi";
import toast from "react-hot-toast";

const empty = { title: "", company: "", startDate: "", endDate: "", current: false, description: "" };

export default function ExperienceModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const [entries, setEntries] = useState(user.experience || []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const addEntry = () => {
    if (!form.title || !form.company || !form.startDate) { toast.error("Title, company and start date required"); return; }
    setEntries([...entries, form]);
    setForm(empty); setAdding(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await updateProfile({ experience: entries });
      updateUser(data.user);
      toast.success("Experience saved!");
      onClose();
    } catch { toast.error("Save failed"); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Experience</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="overflow-y-auto p-5 flex-1 space-y-3">
          {entries.map((e, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 flex justify-between items-start">
              <div><p className="font-semibold text-sm">{e.title}</p><p className="text-xs text-gray-500">{e.company}</p></div>
              <button onClick={() => setEntries(entries.filter((_, j) => j !== i))} className="text-red-400 text-sm ml-4">Remove</button>
            </div>
          ))}
          {adding ? (
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              {[["Title", "title"], ["Company", "company"], ["Description", "description"]].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input className="input text-sm" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
                  <input type="month" className="input text-sm" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
                  <input type="month" className="input text-sm" disabled={form.current} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.current} onChange={(e) => setForm({ ...form, current: e.target.checked, endDate: "" })} />
                Currently working here
              </label>
              <div className="flex gap-2"><button onClick={() => setAdding(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button onClick={addEntry} className="btn-primary flex-1 text-sm">Add</button></div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="w-full text-brand-600 border border-dashed border-brand-300 rounded-xl py-3 text-sm hover:bg-brand-50 transition-colors">+ Add experience</button>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
