import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSocketContext } from "./SocketContext";
import { useAuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

// Log a call event to the backend
const logCallEvent = async (callerId, receiverId, callType, status, duration = 0) => {
  try {
    await fetch(`/api/messages/call/${receiverId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callType, status, duration }),
    }).catch(() => {});
  } catch {
    // Silently fail — logging should never block the UI
  }
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();

  const [callStatus, setCallStatus] = useState("idle"); // idle, calling, receiving, connected
  const [callerInfo, setCallerInfo] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [callType, setCallType] = useState("audio"); // audio, video
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const pendingCandidates = useRef([]);
  const pendingSignal = useRef(null);
  const pendingTimeoutRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun.ekiga.net" },
    ],
    iceCandidatePoolSize: 10,
  };


  useEffect(() => {
    if (!socket) return;

    // Listen for incoming call
    socket.on("callUser", ({ signal, fromUserId }) => {
      const conversations = useConversation.getState().conversations;
      const caller = conversations.find(c => c._id === fromUserId) || { _id: fromUserId, fullName: "Unknown User" };
      console.log(`[WebRTC] Received callUser event from ${caller.fullName}. Signal type: ${signal.type}`);
      if (callStatus !== "idle") {
        console.log(`[WebRTC] Busy, auto-declining call from ${caller.fullName}`);
        socket.emit("declineCall", { to: fromUserId });
        logCallEvent(fromUserId, authUser._id, signal.type, "missed", 0);
        return;
      }
      setCallStatus("receiving");
      setCallerInfo(caller);
      setCallType(signal.type);
      pendingSignal.current = signal.sdp;
      callStartRef.current = Date.now();
      callDurationRef.current = 0;
      // Auto-decline after 30 seconds if not answered
      const timeoutId = setTimeout(() => {
        if (callStatus === "receiving") {
          socket.emit("declineCall", { to: fromUserId });
          logCallEvent(fromUserId, authUser._id, signal.type, "missed", 0);
          toast.error("Call timed out — no answer");
          cleanupCallState();
        }
      }, 30000);
      pendingTimeoutRef.current = timeoutId;
    });

    // Listen for accepted call
    socket.on("callAccepted", async ({ signal }) => {
      console.log("[WebRTC] Received callAccepted event, setting remote session description");
      try {
        setCallStatus("connected");
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
          console.log("[WebRTC] Remote session description set successfully");
          while (pendingCandidates.current.length > 0) {
            const cand = pendingCandidates.current.shift();
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(cand));
          }
        }
      } catch (err) {
        console.error("[WebRTC] Error setting remote description on callAccepted:", err);
      }
    });

    // Listen for ICE candidates
    socket.on("iceCandidate", async ({ candidate }) => {
      try {
        if (peerConnection.current && peerConnection.current.remoteDescription) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidates.current.push(candidate);
        }
      } catch (err) {
        console.error("Error adding ice candidate:", err);
      }
    });

    // Listen for call ended
    socket.on("callEnded", () => {
      console.log("[WebRTC] Call ended by partner");
      cleanupCallState();
      toast.success("Call ended by partner");
    });

    socket.on("callDeclined", () => {
      console.log("[WebRTC] Call declined by partner");
      cleanupCallState();
      toast.error("User is busy or declined the call");
    });

    return () => {
      socket.off("callUser");
      socket.off("callAccepted");
      socket.off("iceCandidate");
      socket.off("callEnded");
      socket.off("callDeclined");
    };
  }, [socket, callStatus]);

  const getMediaStreamWithFallback = async (requestedType) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Media devices API is not supported in this browser");
    }

    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: requestedType === "video",
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return { stream, effectiveType: requestedType };
    } catch (err) {
      console.warn("[WebRTC] Primary getUserMedia failed:", err);

      // Fallback 1: If requestedType === "video" failed, try audio-only
      if (requestedType === "video") {
        toast("Camera unavailable or blocked. Switching to audio call.", { icon: "🎙️" });
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          return { stream, effectiveType: "audio" };
        } catch (audioErr) {
          err = audioErr;
        }
      }

      // Fallback 2: If NotReadableError / "Could not start audio source" occurs, try minimal audio constraint
      if (err.name === "NotReadableError" || err.name === "TrackStartError" || (err.message && err.message.includes("audio source"))) {
        console.warn("[WebRTC] Audio source busy or constraint failed. Retrying with basic audio boolean...");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          return { stream, effectiveType: "audio" };
        } catch (basicErr) {
          throw new Error("Microphone is in use by another app (Zoom, Meet, Discord) or blocked in Windows Settings.");
        }
      }

      throw err;
    }
  };

  const initiateCall = async (targetUser, type = "audio") => {
    try {
      console.log(`[WebRTC] Initiating call to ${targetUser.fullName} (${targetUser._id}) of type ${type}`);
      setCallStatus("calling");
      setReceiverInfo(targetUser);

      const { stream, effectiveType } = await getMediaStreamWithFallback(type);
      setCallType(effectiveType);
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(iceServers);
      peerConnection.current = pc;

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC ICE State]: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === "failed") {
          console.warn("[WebRTC] ICE Connection failed. Attempting ICE restart...");
          pc.restartIce();
        } else if (pc.iceConnectionState === "disconnected") {
          console.warn("[WebRTC] ICE Connection disconnected");
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC Peer Connection State]: ${pc.connectionState}`);
        if (pc.connectionState === "failed") {
          toast.error("Call connection degraded or lost");
        }
      };

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("iceCandidate", { to: targetUser._id, candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("callUser", {
        userToCall: targetUser._id,
        signalData: { sdp: offer, type: effectiveType },
      });

    } catch (err) {
      console.error("Failed to start WebRTC media stream:", err);
      cleanupCallState();
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone/Camera permission denied in browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        toast.error("No microphone device detected on your hardware.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError" || (err.message && err.message.includes("audio source"))) {
        toast.error("Microphone is in use by another app (Zoom/Meet/Discord) or blocked by Windows Settings.");
      } else {
        toast.error("Could not access media devices: " + (err.message || "Unknown error"));
      }
    }
  };

  const acceptCall = async () => {
    try {
      if (!callerInfo || !pendingSignal.current) return;
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
      const startedAt = callStartRef.current || Date.now();
      callDurationRef.current = 0;
      setCallStatus("connected");
      // Track duration while connected
      const interval = setInterval(() => {
        callDurationRef.current = Math.floor((Date.now() - startedAt) / 1000);
      }, 1000);

      const { stream, effectiveType } = await getMediaStreamWithFallback(callType);
      setCallType(effectiveType);
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(iceServers);
      peerConnection.current = pc;
      pc._durationInterval = interval;

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC ICE State]: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === "failed") {
          console.warn("[WebRTC] ICE Connection failed. Attempting ICE restart...");
          pc.restartIce();
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC Peer Connection State]: ${pc.connectionState}`);
        if (pc.connectionState === "failed") {
          toast.error("Call connection degraded or lost");
        }
      };

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("iceCandidate", { to: callerInfo._id, candidate: event.candidate });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(pendingSignal.current));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answerCall", {
        to: callerInfo._id,
        signal: answer,
      });

      while (pendingCandidates.current.length > 0) {
        const cand = pendingCandidates.current.shift();
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      }

    } catch (err) {
      console.error("Failed to accept call:", err);
      cleanupCallState();
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone/Camera permission denied in browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        toast.error("No microphone device detected on your hardware.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError" || (err.message && err.message.includes("audio source"))) {
        toast.error("Microphone is in use by another app (Zoom/Meet/Discord) or blocked by Windows Settings.");
      } else {
        toast.error("Could not capture audio/video components: " + (err.message || "Unknown error"));
      }
    }
  };

  // Screen Sharing Toggle
  const toggleScreenShare = async () => {
    if (!peerConnection.current || callStatus !== "connected") return;

    try {
      if (!isScreenSharing) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const sender = peerConnection.current.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        setIsScreenSharing(true);
        toast.success("Screen sharing started");

        // Revert when user stops sharing via browser bar
        screenTrack.onended = () => {
          stopScreenShare();
        };
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Screen share error:", err);
      toast.error("Could not share screen");
    }
  };

  const stopScreenShare = async () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (peerConnection.current && localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnection.current.getSenders().find((s) => s.track && s.track.kind === "video");
      if (sender && cameraTrack) {
        await sender.replaceTrack(cameraTrack);
      }
    }

    setIsScreenSharing(false);
    toast.success("Stopped screen sharing");
  };

  const endCall = () => {
    const targetId = callerInfo?._id || receiverInfo?._id;
    const duration = callDurationRef.current;
    if (socket && targetId) {
      socket.emit("endCall", { to: targetId });
      logCallEvent(authUser._id, targetId, callType, "completed", duration);
    }
    cleanupCallState();
  };

  const declineCall = () => {
    if (socket && callerInfo) {
      socket.emit("declineCall", { to: callerInfo._id });
      logCallEvent(authUser._id, callerInfo._id, callType, "declined", 0);
    }
    cleanupCallState();
  };

  // Track call duration
  const callDurationRef = useRef(0);
  const callStartRef = useRef(null);

  const cleanupCallState = () => {
    setCallStatus("idle");
    setCallerInfo(null);
    setReceiverInfo(null);
    setRemoteStream(null);
    setIsScreenSharing(false);
    pendingSignal.current = null;
    pendingCandidates.current = [];

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    if (peerConnection.current) {
      if (peerConnection.current._durationInterval) {
        clearInterval(peerConnection.current._durationInterval);
      }
      peerConnection.current.close();
      peerConnection.current = null;
    }
  };

  return (
    <CallContext.Provider
      value={{
        callStatus,
        callerInfo,
        receiverInfo,
        callType,
        localStream,
        remoteStream,
        isScreenSharing,
        toggleScreenShare,
        initiateCall,
        acceptCall,
        declineCall,
        endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
