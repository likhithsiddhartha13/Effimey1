import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2, Users } from 'lucide-react';
import { toggleMic, toggleVideo, hangUp } from '../services/webrtcService';

interface VideoCallModalProps {
  channelId: string;
  channelName: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onClose: () => void;
  isCaller: boolean;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({ 
  channelId, 
  channelName,
  localStream, 
  remoteStream, 
  onClose,
  isCaller
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [hasRemoteAudio, setHasRemoteAudio] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      // Initialize state based on the stream tracks
      setIsVideoOn(localStream.getVideoTracks().length > 0 && localStream.getVideoTracks()[0].enabled);
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      
      const checkTracks = () => {
          setHasRemoteVideo(remoteStream.getVideoTracks().length > 0 && remoteStream.getVideoTracks()[0].enabled);
          setHasRemoteAudio(remoteStream.getAudioTracks().length > 0);
      };
      
      checkTracks(); // Initial check

      // Listen for tracks to determine if we actually have video/audio
      remoteStream.addEventListener('addtrack', checkTracks);
      remoteStream.addEventListener('removetrack', checkTracks);
      
      return () => {
          remoteStream.removeEventListener('addtrack', checkTracks);
          remoteStream.removeEventListener('removetrack', checkTracks);
      }
    }
  }, [remoteStream]);

  const handleToggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    toggleMic(newState);
  };

  const handleToggleVideo = () => {
    const newState = !isVideoOn;
    setIsVideoOn(newState);
    toggleVideo(newState);
  };

  const handleHangUp = async () => {
    await hangUp(channelId);
    onClose();
  };

  if (isMinimized) {
      return (
          <div className="fixed bottom-4 right-4 z-[100] w-48 bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 fade-in duration-300">
              <div className="relative aspect-video bg-black">
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className={`w-full h-full object-cover ${!hasRemoteVideo ? 'hidden' : ''}`}
                  />
                  {!hasRemoteVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                          <Users className="text-white/20" />
                          {hasRemoteAudio && <div className="absolute w-2 h-2 bg-green-500 rounded-full bottom-2 right-2 border border-black animate-pulse"></div>}
                      </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => setIsMinimized(false)} className="p-1 bg-black/50 text-white rounded hover:bg-black/70">
                          <Maximize2 size={12} />
                      </button>
                  </div>
              </div>
              <div className="p-2 flex justify-between items-center bg-slate-800">
                  <span className="text-xs font-bold text-white truncate max-w-[80px]">{channelName}</span>
                  <button onClick={handleHangUp} className="p-1.5 bg-red-500 rounded-full text-white">
                      <PhoneOff size={12} />
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-start pointer-events-none">
            <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${hasRemoteAudio || hasRemoteVideo ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'} `}></span>
                    {channelName}
                </h3>
                <p className="text-white/60 text-xs">
                    {hasRemoteVideo ? 'Video Connected' : hasRemoteAudio ? 'Audio Connected' : isCaller ? 'Calling...' : 'Connecting...'}
                </p>
            </div>
            <button 
                onClick={() => setIsMinimized(true)}
                className="pointer-events-auto p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
            >
                <Minimize2 size={20} />
            </button>
        </div>

        {/* Main Remote Video / Audio Placeholder */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-cover ${!hasRemoteVideo ? 'hidden' : ''}`}
            />
            
            {/* Audio Call Visualizer / Placeholder */}
            {!hasRemoteVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                    <div className="relative">
                        <div className={`w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center mb-4 z-10 relative border-4 border-zinc-700 ${hasRemoteAudio ? 'border-green-500/50' : ''}`}>
                            <Users size={64} className="text-zinc-500" />
                        </div>
                        {/* Pulsing rings for active audio */}
                        {hasRemoteAudio && (
                            <>
                                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"></div>
                                <div className="absolute inset-[-20px] rounded-full border border-green-500/10 animate-pulse delay-75"></div>
                            </>
                        )}
                    </div>
                    <p className="text-zinc-400 font-medium mt-4 animate-pulse">
                        {hasRemoteAudio ? 'User is speaking...' : 'Waiting for others to join...'}
                    </p>
                </div>
            )}

            {/* Local Video Picture-in-Picture */}
            <div className={`absolute bottom-24 right-6 w-32 md:w-48 aspect-[3/4] md:aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-all duration-300 ${!isVideoOn ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded">You</div>
            </div>
        </div>

        {/* Controls */}
        <div className="h-24 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-6 pb-6">
            <button 
                onClick={handleToggleMic}
                className={`p-4 rounded-full transition-all duration-200 ${isMicOn ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500/30'}`}
            >
                {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>

            <button 
                onClick={handleHangUp}
                className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition-all shadow-lg shadow-red-600/30"
            >
                <PhoneOff size={32} fill="currentColor" />
            </button>

            <button 
                onClick={handleToggleVideo}
                className={`p-4 rounded-full transition-all duration-200 ${isVideoOn ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500/30'}`}
            >
                {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
        </div>
    </div>
  );
};

export default VideoCallModal;