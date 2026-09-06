import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import { FaChevronLeft, FaSave, FaUser, FaQuoteLeft, FaCircle, FaCamera, FaCloudUploadAlt, FaTrashAlt, FaImage } from "react-icons/fa";
import Avatar from "../../components/Avatar";

const Profile = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState(authUser.fullName || "");
  const [bio, setBio] = useState(authUser.bio || "Hey there! I am using GuppShup.");
  const [status, setStatus] = useState(authUser.status || "Active");
  const [profilePic, setProfilePic] = useState(authUser.profilePic || "");
  const [loading, setLoading] = useState(false);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const presetAvatars = [
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%233b82f6"/><circle cx="50" cy="45" r="20" fill="%23ffdbb5"/><path d="M30 70c0-10 10-15 20-15s20 5 20 15v10H30V70z" fill="%231e3a8a"/><circle cx="43" cy="42" r="3" fill="%23000"/><circle cx="57" cy="42" r="3" fill="%23000"/><path d="M46 52s2 3 4 3 4-3 4-3" stroke="%23000" stroke-width="2" fill="none"/></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ec4899"/><circle cx="50" cy="45" r="20" fill="%23ffdbb5"/><path d="M30 70c0-10 10-15 20-15s20 5 20 15v10H30V70z" fill="%234c0519"/><circle cx="43" cy="42" r="3" fill="%23000"/><circle cx="57" cy="42" r="3" fill="%23000"/><path d="M46 52s2 3 4 3 4-3 4-3" stroke="%23000" stroke-width="2" fill="none"/></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2310b981"/><circle cx="50" cy="45" r="20" fill="%23ffdbb5"/><path d="M30 70c0-10 10-15 20-15s20 5 20 15v10H30V70z" fill="%23064e3b"/><circle cx="43" cy="42" r="3" fill="%23000"/><circle cx="57" cy="42" r="3" fill="%23000"/><path d="M46 52s2 3 4 3 4-3 4-3" stroke="%23000" stroke-width="2" fill="none"/></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23f59e0b"/><circle cx="50" cy="45" r="20" fill="%23ffdbb5"/><path d="M30 70c0-10 10-15 20-15s20 5 20 15v10H30V70z" fill="%2378350f"/><circle cx="43" cy="42" r="3" fill="%23000"/><circle cx="57" cy="42" r="3" fill="%23000"/><path d="M46 52s2 3 4 3 4-3 4-3" stroke="%23000" stroke-width="2" fill="none"/></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%238b5cf6"/><circle cx="50" cy="45" r="20" fill="%23ffdbb5"/><path d="M30 70c0-10 10-15 20-15s20 5 20 15v10H30V70z" fill="%232e1065"/><circle cx="43" cy="42" r="3" fill="%23000"/><circle cx="57" cy="42" r="3" fill="%23000"/><path d="M46 52s2 3 4 3 4-3 4-3" stroke="%23000" stroke-width="2" fill="none"/></svg>'
  ];

  // Process and compress local image file
  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP, etc.)");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("Image file size exceeds 12MB limit");
      return;
    }

    setIsProcessingImg(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxDim = 512;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", 0.88);
          setProfilePic(compressed);
          toast.success("Photo loaded! Click 'Save Changes' to save.");
        } catch (err) {
          console.error("Image compression error:", err);
          setProfilePic(e.target.result);
        } finally {
          setIsProcessingImg(false);
        }
      };
      img.onerror = () => {
        toast.error("Failed to read image file");
        setIsProcessingImg(false);
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setIsProcessingImg(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, bio, status, profilePic }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      const updatedUser = { ...authUser, ...data };
      localStorage.setItem("chat-user", JSON.stringify(updatedUser));
      setAuthUser(updatedUser);
      toast.success("Profile updated successfully!");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case "Active": return "text-green-500";
      case "Away": return "text-orange-500";
      case "Do Not Disturb": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="w-full max-w-[650px] p-8 glass-panel mx-auto my-8 text-[var(--text-main)] rounded-[2.5rem]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--panel-border)]">
        <Link to="/" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
          <FaChevronLeft />
          <span className="font-semibold text-sm">Back to Chat</span>
        </Link>
        <h2 className="serif-heading text-3xl font-normal text-[var(--text-main)]">
          My Profile
        </h2>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Avatar Section with Local Upload */}
        <div className="flex flex-col items-center gap-5">
          <div
            className={`relative group cursor-pointer rounded-full transition-all duration-300 ${
              isDragging ? "ring-4 ring-[var(--accent)] scale-105" : ""
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            title="Click or drag an image here to upload from your device"
          >
            <Avatar
              src={profilePic}
              name={fullName}
              className="w-28 h-28 border-4 border-[var(--accent)] object-cover shadow-xl group-hover:opacity-85 transition-opacity"
            />
            {/* Camera Overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
              <FaCamera className="text-xl mb-1" />
              <span className="text-[10px] font-semibold tracking-wider uppercase">Upload</span>
            </div>

            {/* Processing spinner */}
            {isProcessingImg && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <span className="loading loading-spinner text-[var(--accent)] loading-sm"></span>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
            className="hidden"
          />

          {/* Action Buttons for Avatar */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImg}
              className="px-4 py-2 rounded-xl bg-[var(--accent)]/15 hover:bg-[var(--accent)]/25 text-[var(--text-main)] border border-[var(--panel-border)] text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-sm cursor-pointer"
            >
              <FaCloudUploadAlt className="text-sm text-[var(--accent)]" />
              <span>Upload from Device</span>
            </button>

            {profilePic && (
              <button
                type="button"
                onClick={() => setProfilePic("")}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Reset to default initials avatar"
              >
                <FaTrashAlt className="text-[10px]" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Preset Avatars & Custom URL */}
          <div className="w-full text-center space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-muted)] block">
              Select from Preset Avatars
            </label>
            <div className="flex justify-center gap-3 overflow-x-auto py-1">
              {presetAvatars.map((avUrl, index) => (
                <img
                  key={index}
                  src={avUrl}
                  alt={`preset-${index}`}
                  onClick={() => setProfilePic(avUrl)}
                  className={`w-11 h-11 rounded-full cursor-pointer border-2 transition-transform hover:scale-110 ${
                    profilePic === avUrl ? "border-[var(--accent)] scale-105 shadow-md ring-2 ring-[var(--accent)]/30" : "border-[var(--panel-border)] opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Or enter custom Image URL..."
                value={profilePic}
                onChange={(e) => setProfilePic(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--panel-bg)] text-[color:var(--text-main)] border border-[color:var(--panel-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] placeholder:text-[color:var(--text-muted)] backdrop-blur-sm transition-colors duration-300"
              />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-main)] mb-1.5 flex items-center gap-1.5">
              <FaUser className="text-[9px]" /> Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--panel-bg)] text-[color:var(--text-main)] border border-[color:var(--panel-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] placeholder:text-[color:var(--text-muted)] backdrop-blur-sm transition-colors duration-300"
            />
          </div>

          {/* Username (read-only) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)] mb-1.5">
              Username (Cannot be changed)
            </label>
            <input
              type="text"
              disabled
              value={authUser.username}
              className="w-full px-4 py-2 rounded-lg bg-[var(--panel-bg)] text-[color:var(--text-muted)] border border-[color:var(--panel-border)] focus:outline-none backdrop-blur-sm transition-colors duration-300 cursor-not-allowed"
            />
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-main)] mb-1.5 flex items-center gap-1.5">
              <FaCircle className={`text-[9px] ${getStatusColor(status)}`} /> Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--panel-bg)] text-[color:var(--text-main)] border border-[color:var(--panel-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] placeholder:text-[color:var(--text-muted)] backdrop-blur-sm transition-colors duration-300 cursor-pointer"
            >
              <option value="Active">Active (Online)</option>
              <option value="Away">Away</option>
              <option value="Do Not Disturb">Do Not Disturb</option>
            </select>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-main)] mb-1.5 flex items-center gap-1.5">
              <FaQuoteLeft className="text-[9px]" /> Biography
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              className="w-full px-4 py-2 rounded-lg bg-[var(--panel-bg)] text-[color:var(--text-main)] border border-[color:var(--panel-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] placeholder:text-[color:var(--text-muted)] backdrop-blur-sm transition-colors duration-300 resize-none"
            />
          </div>
        </div>

        {/* Theme Settings */}
        <div className="p-5 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-[1.5rem] space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-muted)]">Choose Website Theme</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: "terracotta", name: "Warm Terracotta", desc: "High-contrast cream" },
              { id: "midnight", name: "Midnight Cozy", desc: "Deepened OLED vibe" },
              { id: "lilac", name: "Lilac Lavender", desc: "Softened purple" },
              { id: "forest", name: "Sage Forest", desc: "User favorite green" },
              { id: "sapphire", name: "Dark Sapphire", desc: "User favorite blue" }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all hover:scale-[1.03] ${
                  theme === t.id
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-main)]"
                    : "border-[var(--panel-border)] bg-[var(--input-bg)] text-[var(--text-muted)]"
                }`}
              >
                <span className="font-bold text-xs">{t.name}</span>
                <span className="text-[9px] text-[var(--text-muted)] leading-tight mt-1">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 hover-scale disabled:opacity-50 transition-colors"
        >
          <FaSave />
          <span>{loading ? "Saving..." : "Save Changes"}</span>
        </button>
      </form>
    </div>
  );
};

export default Profile;
