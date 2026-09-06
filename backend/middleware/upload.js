import multer from "multer";
import path from "path";

const ALLOWED_MIMES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/webm", "video/quicktime",
  "audio/mpeg", "audio/ogg", "audio/webm", "audio/wav", "audio/mp4",
  "application/pdf",
  "text/plain",
]);

const DANGEROUS_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".php", ".phtml", ".js", ".mjs", ".html",
  ".htm", ".jsp", ".asp", ".aspx", ".py", ".rb", ".pl", ".cgi", ".jar", ".vbs",
]);

// Sanitize filename helper to prevent path traversal or special control chars
export const sanitizeFileName = (originalName) => {
  if (!originalName || typeof originalName !== "string") return "attachment";
  const basename = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, "_");
  return basename.slice(0, 100);
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(new Error("Executable or script file extensions are prohibited for security"), false);
  }

  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported or disallowed file type"), false);
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 1, // Only 1 file per upload request
  },
  fileFilter,
});

