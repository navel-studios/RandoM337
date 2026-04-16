import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
};

export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, waiting, connecting, connected
  
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const mediaAttempted = useRef(false);
  
  useEffect(() => {
    // Only connect socket if we aren't already
    if (!socketRef.current) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        socketRef.current = io(apiUrl);
    }
    
    if (!mediaAttempted.current) {
        mediaAttempted.current = true;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            setLocalStream(stream);
        })
        .catch((err) => {
            console.error('Error accessing media devices.', err);
            setStatus('error');
        });
    }

    return () => {
      if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(STUN_SERVERS);
    pcRef.current = pc;

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice_candidate', event.candidate);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setStatus('connected');
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setStatus('idle');
        setRemoteStream(null);
      }
    };

    return pc;
  }, [localStream]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onWaiting = () => setStatus('waiting');
    
    const onMatchFound = async ({ caller }) => {
      setStatus('connecting');
      const pc = createPeerConnection();

      if (caller) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', offer);
        } catch (err) {
          console.error('Error creating offer', err);
        }
      }
    };

    const onOffer = async (offer) => {
      const pc = pcRef.current || createPeerConnection();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', answer);
      } catch (err) {
        console.error('Error handling offer', err);
      }
    };

    const onAnswer = async (answer) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error handling answer', err);
        }
      }
    };

    const onIceCandidate = async (candidate) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate', err);
        }
      }
    };

    const onPartnerLeft = () => {
      setStatus('idle');
      setRemoteStream(null);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };

    socket.on('waiting', onWaiting);
    socket.on('match_found', onMatchFound);
    socket.on('offer', onOffer);
    socket.on('answer', onAnswer);
    socket.on('ice_candidate', onIceCandidate);
    socket.on('partner_left', onPartnerLeft);

    return () => {
      socket.off('waiting', onWaiting);
      socket.off('match_found', onMatchFound);
      socket.off('offer', onOffer);
      socket.off('answer', onAnswer);
      socket.off('ice_candidate', onIceCandidate);
      socket.off('partner_left', onPartnerLeft);
    };
  }, [createPeerConnection]);

  const findPartner = useCallback(() => {
    if (!socketRef.current) return;
    setStatus('waiting');
    socketRef.current.emit('find_partner');
  }, []);

  const skipPartner = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('leave_partner');
    setStatus('idle');
    setRemoteStream(null);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  const nextPartner = useCallback(() => {
    skipPartner();
    setTimeout(() => {
      findPartner();
    }, 100);
  }, [skipPartner, findPartner]);

  return {
    localStream,
    remoteStream,
    status,
    findPartner,
    skipPartner,
    nextPartner
  };
};
