
import { db } from "./firebase";
import firebase from "./firebase";

const CALLS_COLLECTION = 'calls';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global PC reference for the session
let pc: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

export const setupMediaSources = async (videoEnabled: boolean = true) => {
  try {
    // Clean up existing stream if any
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: videoEnabled, audio: true });
    } catch (err) {
      if (videoEnabled) {
        console.warn("Failed to access video source, falling back to audio only:", err);
        // Fallback to audio only
        localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      } else {
        throw err;
      }
    }
    
    remoteStream = new MediaStream();
    return { localStream, remoteStream };
  } catch (err) {
    console.error("Error accessing media devices:", err);
    throw err;
  }
};

export const createCall = async (channelId: string, onRemoteStream: (stream: MediaStream) => void) => {
  pc = new RTCPeerConnection(servers);

  if (!localStream || !remoteStream) await setupMediaSources();

  // Push tracks from local stream to peer connection
  localStream?.getTracks().forEach((track) => {
    pc?.addTrack(track, localStream!);
  });

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream?.addTrack(track);
    });
    onRemoteStream(remoteStream!);
  };

  // Create the call document
  const callDoc = db.collection(CALLS_COLLECTION).doc(channelId);
  const offerCandidates = callDoc.collection('offerCandidates');
  const answerCandidates = callDoc.collection('answerCandidates');

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await callDoc.set({ offer });

  // Listen for remote answer
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!pc?.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  answerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc?.addIceCandidate(candidate);
      }
    });
  });

  return channelId;
};

export const joinCall = async (channelId: string, onRemoteStream: (stream: MediaStream) => void) => {
  const callDoc = db.collection(CALLS_COLLECTION).doc(channelId);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  pc = new RTCPeerConnection(servers);

  if (!localStream || !remoteStream) await setupMediaSources();

  localStream?.getTracks().forEach((track) => {
    pc?.addTrack(track, localStream!);
  });

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream?.addTrack(track);
    });
    onRemoteStream(remoteStream!);
  };

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callSnapshot = await callDoc.get();
  if (!callSnapshot.exists) throw new Error("Call document does not exist");
  const callData = callSnapshot.data();
  if (!callData?.offer) throw new Error("Could not find call offer");

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc?.addIceCandidate(candidate);
      }
    });
  });
};

export const hangUp = async (channelId: string) => {
  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }
  
  if (pc) {
    pc.close();
    pc = null;
  }
  
  localStream = null;
  remoteStream = null;

  // Clean up Firestore
  try {
      const callDoc = db.collection(CALLS_COLLECTION).doc(channelId);
      await callDoc.delete();
  } catch (e) {
      console.error("Error cleaning up call doc", e);
  }
};

export const toggleMic = (enabled: boolean) => {
    if (localStream) {
        localStream.getAudioTracks().forEach(track => track.enabled = enabled);
    }
}

export const toggleVideo = (enabled: boolean) => {
    if (localStream) {
        localStream.getVideoTracks().forEach(track => track.enabled = enabled);
    }
}
