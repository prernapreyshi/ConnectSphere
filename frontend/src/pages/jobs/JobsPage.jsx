import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getJobs } from "../../api/jobApi";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import Navbar from "../../components/layout/Navbar";
import PostJobModal from "./PostJobModal";

const JOB_TYPES = ["full-time", "part-time", "contract", "internship", "remote"];
const EXPERIENCE = ["entry", "mid", "senior", "lead", "any"];

const typeBadge = { "full-time": "bg-green-100 text-green-700", "part-time": "bg-yellow-100 text-yellow-700",
  contract: "bg-orange-100 text-orange-700", internship: "bg-blue-100 text-blue-700", remote: "bg-purple-100 text-purple-700" };

const timeAgo = (d) => {
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

function JobCard({ job, onClick }) {
  return (
    <button onClick={() => onClick(job)} className="card w-full p-5 text-left hover:shadow-md hover:border-brand-200 transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-100 to-blue-100 flex items-center justify-center text-lg flex-shrink-0 font-bold text-brand-700">
          {job.company.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{job.title}</h3>
          <p className="text-sm text-gray-600">{job.company}</p>
          <p className="text-xs text-gray-400 mt-0.5">📍 {job.location}</p>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(job.createdAt)}</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${typeBadge[job.type] || "bg-gray-100 text-gray-600"}`}>
          {job.type}
        </span>
        {job.experience !== "any" && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600 capitalize">{job.experience} level</span>
        )}
        {job.salary?.min && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">
            ₹{(job.salary.min / 100000).toFixed(1)}–{(job.salary.max / 100000).toFixed(1)} LPA
          </span>
        )}
      </div>
      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md">{s}</span>
          ))}
          {job.skills.length > 4 && <span className="text-xs text-gray-400">+{job.skills.length - 4} more</span>}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3">{job.applicantCount || 0} applicant{job.applicantCount !== 1 ? "s" : ""}</p>
    </button>
  );
}

export default function JobsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ type: "", experience: "", location: "" });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(new Set());

  const fetchFn = useCallback(
    (cursor) => getJobs({ ...filters, cursor }),
    [filters]
  );
  const { posts: jobs, loading, hasMore, initialLoaded, loaderRef, prepend } = useInfiniteScroll(fetchFn);

  const handleApply = async () => {
    if (!selectedJob) return;
    setApplying(true);
    try {
      const { applyForJob } = await import("../../api/jobApi");
      await applyForJob(selectedJob._id);
      setApplied((prev) => new Set([...prev, selectedJob._id]));
      const toast = (await import("react-hot-toast")).default;
      toast.success("Application submitted!");
    } catch (err) {
      const toast = (await import("react-hot-toast")).default;
      toast.error(err.response?.data?.message || "Apply failed");
    } finally { setApplying(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <button onClick={() => setShowPostModal(true)} className="btn-primary text-sm py-2 px-4">
            + Post a job
          </button>
        </div>

        {/* Filters */}
        <div className="card p-3 mb-5 flex flex-wrap gap-3">
          {[
            { label: "Type", key: "type", opts: JOB_TYPES },
            { label: "Experience", key: "experience", opts: EXPERIENCE },
          ].map(({ label, key, opts }) => (
            <select key={key} value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
              className="input text-sm py-1.5 w-auto flex-1 min-w-[120px]">
              <option value="">All {label}s</option>
              {opts.map((o) => <option key={o} value={o} className="capitalize">{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </select>
          ))}
          <input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            placeholder="Location…" className="input text-sm py-1.5 flex-1 min-w-[120px]" />
          {Object.values(filters).some(Boolean) && (
            <button onClick={() => setFilters({ type: "", experience: "", location: "" })}
              className="text-sm text-gray-500 hover:text-gray-700 px-2">Clear</button>
          )}
        </div>

        <div className="flex gap-5">
          {/* Job list */}
          <div className="flex-1 space-y-3 min-w-0">
            {!initialLoaded ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : jobs.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-3xl mb-3">💼</p>
                <p className="text-gray-500">No jobs found. Try adjusting your filters!</p>
              </div>
            ) : (
              <>
                {jobs.map((job) => <JobCard key={job._id} job={job} onClick={setSelectedJob} />)}
                <div ref={loaderRef} className="py-4 flex justify-center">
                  {loading && <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />}
                  {!hasMore && jobs.length > 3 && <p className="text-xs text-gray-400">All jobs loaded ✓</p>}
                </div>
              </>
            )}
          </div>

          {/* Job detail panel */}
          {selectedJob && (
            <aside className="w-96 flex-shrink-0 hidden lg:block">
              <div className="card p-6 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-100 to-blue-100 flex items-center justify-center text-2xl font-bold text-brand-700 flex-shrink-0">
                    {selectedJob.company.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg leading-tight">{selectedJob.title}</h2>
                    <p className="text-gray-600">{selectedJob.company}</p>
                    <p className="text-sm text-gray-400">📍 {selectedJob.location}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${typeBadge[selectedJob.type]}`}>{selectedJob.type}</span>
                  {selectedJob.experience !== "any" && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{selectedJob.experience} level</span>}
                  {selectedJob.salary?.min && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                      ₹{(selectedJob.salary.min / 100000).toFixed(1)}–{(selectedJob.salary.max / 100000).toFixed(1)} LPA
                    </span>
                  )}
                </div>

                <button onClick={handleApply} disabled={applying || applied.has(selectedJob._id)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors mb-5
                    ${applied.has(selectedJob._id) ? "bg-green-50 text-green-600 border border-green-200 cursor-not-allowed"
                      : "btn-primary"}`}>
                  {applying ? "Submitting…" : applied.has(selectedJob._id) ? "✓ Applied" : "Apply now"}
                </button>

                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">About this role</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                  </div>

                  {selectedJob.requirements?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                      <ul className="space-y-1">
                        {selectedJob.requirements.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-600">
                            <span className="text-brand-500 mt-0.5 flex-shrink-0">•</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedJob.skills?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.skills.map((s) => (
                          <span key={s} className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-md">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedJob.deadline && (
                    <p className="text-xs text-gray-400">
                      Application deadline: {new Date(selectedJob.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400">Posted by</p>
                    <Link to={`/profile/${selectedJob.postedBy?.username}`} className="flex items-center gap-2 mt-1 hover:opacity-80">
                      <p className="text-sm font-medium text-gray-700">{selectedJob.postedBy?.name}</p>
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      {showPostModal && <PostJobModal onClose={() => setShowPostModal(false)} onCreated={(j) => prepend(j)} />}
    </div>
  );
}
