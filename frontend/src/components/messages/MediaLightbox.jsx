import { FaTimes, FaDownload } from "react-icons/fa";

const MediaLightbox = ({ file, onClose }) => {
  if (!file || !file.fileUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in select-none">
      {/* Top Header Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
        <a
          href={file.fileUrl}
          download={file.fileName || "attachment"}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Download File"
        >
          <FaDownload className="text-lg" />
        </a>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close (Esc)"
        >
          <FaTimes className="text-lg" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center p-2">
        {file.fileType === "image" && (
          <img
            src={file.fileUrl}
            alt={file.fileName || "Attachment preview"}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />
        )}

        {file.fileType === "video" && (
          <video
            src={file.fileUrl}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-xl shadow-2xl"
          />
        )}

        {file.fileType !== "image" && file.fileType !== "video" && (
          <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl flex flex-col items-center text-center max-w-md space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl font-bold">
              📄
            </div>
            <div>
              <h4 className="text-white font-semibold text-lg truncate max-w-xs">{file.fileName || "Document"}</h4>
              <p className="text-slate-400 text-xs mt-1">Click below to download or view external file</p>
            </div>
            <a
              href={file.fileUrl}
              download={file.fileName || "document"}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors shadow-lg"
            >
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLightbox;
