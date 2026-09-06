import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaLock, FaCheck } from "react-icons/fa";

const INPUT_CLS = "w-full px-4 py-2 rounded-lg bg-[var(--panel-bg)] text-[color:var(--text-main)] border border-[color:var(--panel-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] placeholder:text-[color:var(--text-muted)] backdrop-blur-sm transition-colors duration-300";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 6) return toast.error("Min 6 characters");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      navigate("/login");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] p-8 glass-panel shadow-2xl rounded-[2rem] text-[var(--text-main)]">
      <h2 className="serif-heading text-3xl text-center">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)] mb-1 flex items-center gap-1.5"><FaLock className="text-[9px]" /> New Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)] mb-1 flex items-center gap-1.5"><FaLock className="text-[9px]" /> Confirm Password</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" className={INPUT_CLS} />
        </div>
        <button disabled={loading} className="w-full py-3 bg-[var(--accent)] text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <span className="loading loading-spinner loading-sm text-white"></span> : (<><FaCheck className="text-sm" /><span>Reset Password</span></>)}
        </button>
        <div className="text-center"><Link to="/login" className="text-xs text-[var(--accent)] font-semibold hover:underline">Back to Login</Link></div>
      </form>
    </div>
  );
};
export default ResetPassword;
