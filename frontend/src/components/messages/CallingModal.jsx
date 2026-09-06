import { useState, useEffect, useRef } from "react";
import { useCall } from "../../context/CallContext";
import { FaPhone, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaStopCircle } from "react-icons/fa";
import Avatar from "../Avatar";

const CallingModal = () => {
  const {
    callStatus,
    callerInfo,
    receiverInfo,
    callType,
    localStream,
    remoteStream,
    isScreenSharing,
    toggleScreenShare,
    acceptCall,
    declineCall,
    endCall,
  } = useCall();

  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Play streams on video and audio elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, callStatus]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && callType === "video") {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((err) => console.warn("Remote video playback notice:", err));
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((err) => console.warn("Remote audio playback notice:", err));
    }
  }, [remoteStream, callType, callStatus]);

  // Call duration counter
  useEffect(() => {
    if (callStatus === "connected") {
      setDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [callStatus]);

  const handleMuteToggle = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const handleVideoToggle = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (callStatus === "idle") return null;

  const targetUser = callStatus === "receiving" ? callerInfo : receiverInfo;
  if (!targetUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in text-white">
      
      {/* Audio Element for WebRTC audio playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="w-full max-w-md glass-panel p-6 flex flex-col items-center text-center relative border-[var(--panel-border)] shadow-2xl rounded-[2.5rem]">
        
        {/* Calling Header */}
        <div className="w-full flex flex-col items-center space-y-4">
          
          {/* Incoming Ringing State */}
          {callStatus === "receiving" && (
            <div className="space-y-4 w-full">
              <div className="relative flex items-center justify-center w-24 h-24 mx-auto my-2">
                <div className="absolute inset-0 rounded-full bg-[var(--accent)]/15 ring-pulse-1" />
                <div className="absolute inset-0 rounded-full bg-[var(--accent)]/10 ring-pulse-2" />
                <Avatar src={targetUser.profilePic} name={targetUser.fullName} className="w-20 h-20 border-2 border-[var(--accent)] z-10" />
              </div>
              <div>
                <h3 className="serif-heading text-2xl font-normal">{targetUser.fullName}</h3>
                <p className="text-xs text-[var(--accent)] font-semibold tracking-wider uppercase mt-1">
                  Incoming {callType === "video" ? "Video" : "Audio"} Call...
                </p>
              </div>
              <div className="flex gap-6 justify-center pt-4">
                <button
                  onClick={declineCall}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg hover:scale-105"
                  title="Decline"
                >
                  <FaPhoneSlash className="text-xl" />
                </button>
                <button
                  onClick={acceptCall}
                  className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all shadow-lg hover:scale-105"
                  title="Accept"
                >
                  <FaPhone className="text-xl animate-bounce" />
                </button>
              </div>
            </div>
          )}

          {/* Outgoing Dialing State */}
          {callStatus === "calling" && (
            <div className="space-y-4 w-full">
              <div className="relative flex items-center justify-center w-24 h-24 mx-auto my-2">
                <div className="absolute inset-0 rounded-full bg-[var(--accent)]/15 ring-pulse-1" />
                <Avatar src={targetUser.profilePic} name={targetUser.fullName} className="w-20 h-20 border-2 border-[var(--accent)] z-10" />
              </div>
              <div>
                <h3 className="serif-heading text-2xl font-normal">{targetUser.fullName}</h3>
                <p className="text-xs text-[var(--accent)] font-semibold tracking-wider uppercase mt-1">
                  Calling ({callType === "video" ? "Video" : "Audio"})...
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={endCall}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg hover:scale-105"
                  title="End Call"
                >
                  <FaPhoneSlash className="text-xl" />
                </button>
              </div>
            </div>
          )}

          {/* Active Call State */}
          {callStatus === "connected" && (
            <div className="w-full space-y-5">
              <h3 className="serif-heading text-xl font-normal">{targetUser.fullName}</h3>
              <p className="text-xs text-emerald-400 font-semibold tracking-wider mt-0.5">
                Connected • {formatDuration(duration)}
                {isScreenSharing && <span className="ml-2 text-purple-300 animate-pulse">● Screen Sharing</span>}
              </p>

              {/* Video call feeds layout */}
              {callType === "video" ? (
                <div className="w-full aspect-[4/3] rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden shadow-inner">
                  {/* Remote Feed */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Local Pip Feed */}
                  {!isVideoOff && (
                    <div className="absolute bottom-3 right-3 w-1/3 aspect-[4/3] rounded-xl border border-white/20 overflow-hidden shadow-lg z-20">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Audio call profile layout */
                <div className="py-6 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-2 border-[var(--accent)] overflow-hidden shadow-lg">
                    <Avatar src={targetUser.profilePic} name={targetUser.fullName} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-4 flex gap-1 items-center justify-center h-6">
                    <span className="w-1.5 h-3 bg-[var(--accent)] rounded-full animate-pulse"></span>
                    <span className="w-1.5 h-5 bg-[var(--accent)] rounded-full animate-pulse [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-4 bg-[var(--accent)] rounded-full animate-pulse [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              {/* Connected Controls */}
              <div className="flex gap-4 justify-center pt-2">
                <button
                  onClick={handleMuteToggle}
                  className={`p-3.5 rounded-full transition-all border ${
                    isMuted ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/10 border-white/10 hover:bg-white/20"
                  }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <FaMicrophoneSlash className="text-lg" /> : <FaMicrophone className="text-lg" />}
                </button>

                {callType === "video" && (
                  <button
                    onClick={toggleScreenShare}
                    className={`p-3.5 rounded-full transition-all border ${
                      isScreenSharing ? "bg-purple-600 border-purple-400 text-white animate-pulse" : "bg-white/10 border-white/10 hover:bg-white/20"
                    }`}
                    title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
                  >
                    {isScreenSharing ? <FaStopCircle className="text-lg" /> : <FaDesktop className="text-lg" />}
                  </button>
                )}

                <button
                  onClick={endCall}
                  className="p-3.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20 hover:scale-105"
                  title="End Call"
                >
                  <FaPhoneSlash className="text-lg" />
                </button>

                {callType === "video" && (
                  <button
                    onClick={handleVideoToggle}
                    className={`p-3.5 rounded-full transition-all border ${
                      isVideoOff ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/10 border-white/10 hover:bg-white/20"
                    }`}
                    title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                  >
                    {isVideoOff ? <FaVideoSlash className="text-lg" /> : <FaVideo className="text-lg" />}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CallingModal;
