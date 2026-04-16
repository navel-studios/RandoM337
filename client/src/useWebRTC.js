import { useRef, useCallback } from 'react';
import { socket } from './socket';

const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Free TURN relay — handles peers behind strict/symmetric NAT
        // (direct P2P fails across most real-world networks without this)
        {
            urls: [
                'turn:openrelay.metered.ca:80',
                'turn:openrelay.metered.ca:443',
                'turn:openrelay.metered.ca:443?transport=tcp',
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
};

export function useWebRTC({ localVideoRef, remoteVideoRef, onAudioBlocked }) {
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

    /**
     * Create the peer connection and add local tracks.
     * If isInitiator, also create and send the offer.
     * If not initiator, just waits — offer will arrive via socket.
     */
    const startCall = useCallback(async (roomId, isInitiator, localStream) => {
        cleanup();
        roomIdRef.current = roomId;

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Add local tracks so the remote side gets our stream
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        // Display remote stream when tracks arrive.
        // Calling play() explicitly bypasses browser autoplay-with-sound restrictions
        // that silently suppress audio when srcObject is set from an async callback.
        pc.ontrack = (event) => {
            if (!remoteVideoRef.current || !event.streams[0]) return;
            remoteVideoRef.current.srcObject = event.streams[0];
            remoteVideoRef.current.play().catch(() => {
                // Autoplay still blocked — surface the manual unmute button
                if (onAudioBlocked) onAudioBlocked(true);
            });
        };

        // Forward ICE candidates to the server
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
        // Non-initiator: tracks are already added; just waits for the offer event
    }, [cleanup, remoteVideoRef]);

    /**
     * Called when a webrtc_offer arrives.
     * Tracks were already added in startCall — do NOT add them again.
     */
    const handleOffer = useCallback(async (offer) => {
        const pc = pcRef.current;
        if (!pc) return;
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
