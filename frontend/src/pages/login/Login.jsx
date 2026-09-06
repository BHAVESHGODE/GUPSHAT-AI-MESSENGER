import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useLogin from "../../hooks/useLogin";
import { FaUser, FaLock, FaSignInAlt } from "react-icons/fa";

const chatSequences = [
  {
    persona: "Martina",
    badgeBg: "bg-rose-500",
    messages: [
      { sender: "ME", text: "Are you always this distracting?" },
      { sender: "AI", text: "Only when you're paying attention. Play with fire at your own risk. 😏🔥" },
    ],
  },
  {
    persona: "Sid",
    badgeBg: "bg-amber-500",
    messages: [
      { sender: "ME", text: "Bro, my code keeps crashing." },
      { sender: "AI", text: "Just like your dating life. Maybe try turning both off and on again? 😂" },
    ],
  },
  {
    persona: "Ghalib",
    badgeBg: "bg-slate-500",
    messages: [
      { sender: "ME", text: "Today was exhausting." },
      { sender: "AI", text: "Waqt ki aadat hai guzar jana. Have a cup of chai, my friend. ☕" },
    ],
  },
];

const INPUT_CLS = "w-full px-4 py-2 rounded-lg bg-[var(--panel-bg)] text-[color:var(--text-main)] border border-[color:var(--panel-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] placeholder:text-[color:var(--text-muted)] backdrop-blur-sm transition-colors duration-300";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { loading, login } = useLogin();

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % chatSequences.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentChat = chatSequences[activeIndex];

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(identifier, password);
  };

  return (
    <div className="w-full max-w-[1000px] flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 p-4 md:p-8 animate-fade-in text-[var(--text-main)]">
      <div className="hidden md:flex flex-col justify-center max-w-[480px] text-left space-y-6 select-none">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--panel-bg)] border border-[var(--panel-border)] w-fit text-[10px] uppercase tracking-wider text-[var(--accent)] font-bold shadow-sm">
          🍃 GuppShup Chat v2.0
        </div>
        <h1 className="serif-heading text-6xl font-normal leading-[1.05] tracking-tight text-[var(--text-main)]">
          Conversations,<br />evolved.
        </h1>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
          Step into a hyper-modern messaging space. Connect with friends in real-time, switch between stunning custom themes, or vibe with our built-in Character AI. Whether you want a savage roast, flirty banter, or deep poetry—your squad is waiting.
        </p>
        <div className="mt-8 flex flex-col p-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden transition-all duration-500">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
            <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
              Chatting with {currentChat.persona} 🤖
            </span>
            <div className="flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="w-2 h-2 rounded-full bg-white/20" />
              {chatSequences.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Show chat ${idx + 1}`}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeIndex ? "w-6 bg-white/70" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
                />
              ))}
            </div>
          </div>
          <div key={activeIndex} className="flex flex-col gap-4 transition-opacity duration-500">
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-xs bg-white/20 text-white font-bold">
                {currentChat.persona[0]}
              </div>
              <div className="bg-white/10 backdrop-blur-md text-gray-100 border border-white/10 px-5 py-3 rounded-2xl rounded-tl-sm text-sm shadow-sm leading-relaxed">
                {currentChat.messages[1].text}
              </div>
            </div>
            <div className="flex gap-3 justify-end animate-fade-in">
              <div className="bg-[var(--accent)] text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm shadow-lg leading-relaxed">
                {currentChat.messages[0].text}
              </div>
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[10px] bg-[var(--accent)] brightness-[.8] text-white font-bold">
                ME
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[400px] p-8 glass-panel relative overflow-hidden shadow-2xl rounded-[2rem]">
        <div className="text-center mb-8">
          <h2 className="serif-heading text-4xl font-normal text-[var(--text-main)]">Welcome Back</h2>
          <p className="text-xs text-[var(--text-muted)] mt-2">Sign in to continue your secure conversations</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <FaUser className="text-[9px]" /> Username or Email
            </label>
            <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Enter username or email" className={INPUT_CLS} />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <FaLock className="text-[9px]" /> Password
            </label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className={INPUT_CLS} />
          </div>

          <div className="flex items-center justify-between">
            <Link to="/forgot-password" className="text-xs font-semibold text-[var(--accent)] hover:underline">
              Forgot Password?
            </Link>
            <Link to="/signup" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors inline-block">
              No account? <span className="font-semibold text-[var(--accent)]">Sign up</span>
            </Link>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 hover-scale disabled:opacity-50 mt-2 transition-colors duration-200">
            {loading ? <span className="loading loading-spinner loading-sm text-white"></span> : (<><FaSignInAlt className="text-sm" /><span>Login</span></>)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
