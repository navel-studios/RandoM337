import { useRef, useCallback } from 'react';
import { socket } from './socket';

const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export function useWebRTC({ localVideoRef, remoteVideoRef }) {
    const pcRef = useRef(null);
    const roomIdRef = useRef(null);

    const cleanup = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        roomIdRef.current = null;
    }, [remoteVideoRef]);

    const startCall = useCallback(async (roomId, isInitiator, localStream) => {
        cleanup();
        roomIdRef.current = roomId;

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Push local tracks into the connection
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        // When we get remote tracks, show them
        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Send ICE candidates to the server to relay to partner
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_ice_candidate', { roomId, payload: event.candidate });
            }
        };

        if (isInitiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc_offer', { roomId, payload: offer });
        }
    }, [cleanup, remoteVideoRef]);

    const handleOffer = useCallback(async (offer, localStream) => {
        const pc = pcRef.current;
        if (!pc) return;
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { roomId: roomIdRef.current, payload: answer });
    }, []);

    const handleAnswer = useCallback(async (answer) => {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }, []);

    const handleIceCandidate = useCallback(async (candidate) => {
        const pc = pcRef.current;
        if (!pc) return;
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.warn('ICE candidate error:', e);
        }
    }, []);

    return { startCall, handleOffer, handleAnswer, handleIceCandidate, cleanup };
}
