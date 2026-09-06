import { useState, useEffect } from "react";

const Avatar = ({ src, name, className = "w-10 h-10" }) => {
  const [imgError, setImgError] = useState(false);

  // Reset imgError state whenever src prop changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const getDiceBearFallback = (fullName) => {
    if (!fullName) return "https://api.dicebear.com/7.x/notionists/svg?seed=User&backgroundColor=transparent";
    const lower = fullName.toLowerCase();

    // Specific AI persona checks BEFORE generic "ai" check
    if (lower.includes("kabir")) {
      return "/avatars/kabir.jpg";
    }
    if (lower.includes("martina") || lower.includes("tara")) {
      return "/avatars/martina.jpg";
    }
    if (lower.includes("sid")) {
      return "/avatars/sid.jpg";
    }
    if (lower.includes("maverick")) {
      return "/avatars/maverick.jpg";
    }
    if (lower.includes("ghalib")) {
      return "/avatars/ghalib.jpg";
    }
    if (lower.includes("pippaa")) {
      return "/avatars/pippaa_baddie.jpg";
    }
    if (lower.includes("ai") || lower.includes("guppshup")) {
      return "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=GuppShupAIBot&backgroundColor=c0aede";
    }

    return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=transparent`;
  };

  const imageSrc = (!src || imgError) ? getDiceBearFallback(name) : src;

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      <img
        src={imageSrc}
        alt={name || "user profile"}
        onError={() => setImgError(true)}
        className="w-full h-full rounded-full object-cover ring-2 ring-offset-1 ring-offset-black/50 ring-[var(--accent)]/40 shadow-lg transition-transform hover:scale-105 duration-200 bg-white/10"
      />
    </div>
  );
};

export default Avatar;
