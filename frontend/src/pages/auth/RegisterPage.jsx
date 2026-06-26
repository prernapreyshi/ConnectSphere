import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from "../../api/authApi";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.username.trim()) e.username = "Username is required";
    else if (!/^[a-z0-9_]+$/.test(form.username)) e.username = "Only lowercase letters, numbers, underscores";
    if (!form.email.trim()) e.email = "Email is required";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await registerUser(form);
      login(data.accessToken, data.user);
      toast.success(`Welcome to ConnectSphere, ${data.user.name}!`);
      navigate("/feed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ id, label, type = "text", placeholder }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={id} type={type} placeholder={placeholder}
        value={form[id]} onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        className={`input ${errors[id] ? "border-red-400 focus:ring-red-400" : ""}`}
      />
      {errors[id] && <p className="text-red-500 text-xs mt-1">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-3">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join ConnectSphere</h1>
          <p className="text-gray-500 text-sm mt-1">Build your professional network</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field id="name" label="Full name" placeholder="Ravi Kumar" />
            <Field id="username" label="Username" placeholder="ravi_kumar" />
            <Field id="email" label="Email" type="email" placeholder="ravi@example.com" />
            <Field id="password" label="Password" type="password" placeholder="Min. 8 characters" />

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already on ConnectSphere?{" "}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          By joining, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
