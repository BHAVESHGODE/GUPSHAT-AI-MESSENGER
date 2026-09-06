import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaEnvelope, FaPaperPlane } from "react-icons/fa";

const INPUT_CLS = "w-full px-4 py-2 rounded-lg bg-[var(--panel-bg)] text-[color:var(--text-main)] border border-[color:var(--panel-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] placeholder:text-[color:var(--text-muted)] backdrop-blur-sm transition-colors duration-300";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false || data.error) {
        throw new Error(data.error || "Email could not be sent. Please try again.");
      }
      setSent(true);
      toast.success(data.message || "Reset link sent to email.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] p-8 glass-panel shadow-2xl rounded-[2rem] text-[var(--text-main)]">
      <h2 className="serif-heading text-3xl text-center">Forgot Password</h2>
      <p className="text-xs text-[color:var(--text-muted)] text-center mt-2">Enter your email to receive a reset link (15 min expiry).</p>
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)] mb-1 flex items-center gap-1.5"><FaEnvelope className="text-[9px]" /> Email Address</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={INPUT_CLS} />
        </div>
        <button disabled={loading} className="w-full py-3 bg-[var(--accent)] text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <span className="loading loading-spinner loading-sm text-white"></span> : (<><FaPaperPlane className="text-sm" /><span>Send Reset Link</span></>)}
        </button>
        {sent && <p className="text-xs text-center text-[color:var(--text-muted)]">Check your inbox + spam folder for the reset link.</p>}
        <div className="flex justify-between text-xs">
          <Link to="/login" className="text-[var(--accent)] font-semibold hover:underline">Back to Login</Link>
          <Link to="/signup" className="text-[color:var(--text-muted)] hover:text-[var(--accent)]">Create account</Link>
        </div>
      </form>
    </div>
  );
};
export default ForgotPassword;
