import { useRef, useCallback } from 'react';
import { socket } from './socket';

const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
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

export function useWebRTC({ localVideoRef, remoteVideoRef, onAudioBlocked, onIceState }) {
    const pcRef = useRef(null);
    const roomIdRef = useRef(null);
    // ICE candidates that arrived before setRemoteDescription was called
    const pendingCandidatesRef = useRef([]);

    const cleanup = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        roomIdRef.current = null;
        pendingCandidatesRef.current = [];
    }, [remoteVideoRef]);

    // Flush any ICE candidates that arrived before setRemoteDescription
    const flushPendingCandidates = useCallback(async () => {
        const pc = pcRef.current;
        if (!pc) return;
        for (const candidate of pendingCandidatesRef.current) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.warn('ICE flush error:', e);
            }
        }
        pendingCandidatesRef.current = [];
    }, []);

    const startCall = useCallback(async (roomId, isInitiator, localStream) => {
        cleanup();
        roomIdRef.current = roomId;

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.ontrack = (event) => {
            if (!remoteVideoRef.current || !event.streams[0]) return;
            remoteVideoRef.current.srcObject = event.streams[0];
            remoteVideoRef.current.play().catch(() => {
                if (onAudioBlocked) onAudioBlocked(true);
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_ice_candidate', { roomId, payload: event.candidate });
            }
        };

        pc.oniceconnectionstatechange = () => {
            const s = pc.iceConnectionState;
            console.log('[ICE]', s);
            if (onIceState) onIceState(s);
        };

        pc.onicegatheringstatechange = () => {
            console.log('[ICE gathering]', pc.iceGatheringState);
        };

        if (isInitiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc_offer', { roomId, payload: offer });
        }
    }, [cleanup, remoteVideoRef, onAudioBlocked]);

    const handleOffer = useCallback(async (offer) => {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        // Remote description is now set — safe to apply buffered candidates
        await flushPendingCandidates();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { roomId: roomIdRef.current, payload: answer });
    }, [flushPendingCandidates]);

    const handleAnswer = useCallback(async (answer) => {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        // Remote description is now set — safe to apply buffered candidates
        await flushPendingCandidates();
    }, [flushPendingCandidates]);

    const handleIceCandidate = useCallback(async (candidate) => {
        const pc = pcRef.current;
        if (!pc) return;
        if (!pc.remoteDescription) {
            // Too early — buffer until handleOffer/handleAnswer calls flushPendingCandidates
            pendingCandidatesRef.current.push(candidate);
            return;
        }
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.warn('ICE candidate error:', e);
        }
    }, []);

    return { startCall, handleOffer, handleAnswer, handleIceCandidate, cleanup };
}
