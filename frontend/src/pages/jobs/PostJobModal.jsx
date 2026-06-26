import { useState } from "react";
import { createJob } from "../../api/jobApi";
import toast from "react-hot-toast";

const JOB_TYPES = ["full-time", "part-time", "contract", "internship", "remote"];
const EXPERIENCE = ["any", "entry", "mid", "senior", "lead"];

export default function PostJobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "", company: "", location: "", type: "full-time", experience: "any",
    description: "", requirements: "", skills: "",
    salaryMin: "", salaryMax: "", applicationUrl: "", deadline: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.company || !form.location || !form.description) {
      toast.error("Please fill all required fields"); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        requirements: form.requirements.split("\n").map((r) => r.trim()).filter(Boolean),
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        salary: form.salaryMin ? { min: Number(form.salaryMin), max: Number(form.salaryMax || form.salaryMin), currency: "INR", period: "year" } : undefined,
      };
      const { data } = await createJob(payload);
      onCreated?.(data.job);
      toast.success("Job posted!");
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to post job"); }
    finally { setSaving(false); }
  };

  const F = ({ label, id, required, type = "text", placeholder, as }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {as === "textarea" ? (
        <textarea id={id} value={form[id]} onChange={(e) => setForm({ ...form, [id]: e.target.value })}
          placeholder={placeholder} rows={4} className="input text-sm resize-none" />
      ) : (
        <input id={id} type={type} value={form[id]} onChange={(e) => setForm({ ...form, [id]: e.target.value })}
          placeholder={placeholder} className="input text-sm" />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Post a job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <F label="Job title" id="title" required placeholder="e.g. Frontend Developer" />
            <F label="Company" id="company" required placeholder="e.g. Acme Corp" />
          </div>
          <F label="Location" id="location" required placeholder="e.g. Bangalore, India or Remote" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Job type <span className="text-red-400">*</span></label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input text-sm">
                {JOB_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Experience level</label>
              <select value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="input text-sm">
                {EXPERIENCE.map((e) => <option key={e} value={e} className="capitalize">{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <F label="Job description" id="description" required placeholder="Describe the role and responsibilities…" as="textarea" />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Requirements <span className="text-gray-400 font-normal">(one per line)</span></label>
            <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              placeholder={"3+ years React experience\nStrong communication skills"} rows={3} className="input text-sm resize-none" />
          </div>

          <F label="Skills" id="skills" placeholder="React, Node.js, MongoDB…" />

          <div className="grid grid-cols-2 gap-4">
            <F label="Min salary (₹/year)" id="salaryMin" type="number" placeholder="e.g. 600000" />
            <F label="Max salary (₹/year)" id="salaryMax" type="number" placeholder="e.g. 1200000" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F label="Application URL" id="applicationUrl" placeholder="https://…" />
            <F label="Application deadline" id="deadline" type="date" />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
            {saving ? "Posting…" : "Post job"}
          </button>
        </div>
      </div>
    </div>
  );
}
