import { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from './socket';
import { useWebRTC } from './useWebRTC';
import './App.css';

const STATES = {
    IDLE: 'idle',
    QUEUED: 'queued',
    IN_CALL: 'in_call',
};

export default function App() {
    const [state, setState] = useState(STATES.IDLE);
    const [userId, setUserId] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [challenge, setChallenge] = useState(null);
    const [error, setError] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);

    const { startCall, handleOffer, handleAnswer, handleIceCandidate, cleanup } = useWebRTC({
        localVideoRef,
        remoteVideoRef,
    });

    // ── Re-attach local stream whenever the video element is remounted ────────
    // React remounts <video> on state transitions, clearing srcObject.
    useEffect(() => {
        if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [state]);

    // ── Camera helpers ────────────────────────────────────────────────────────

    const startLocalStream = useCallback(async () => {
        if (localStreamRef.current) return localStreamRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
        return stream;
    }, []);

    const stopLocalStream = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
    }, []);

    // ── Actions ───────────────────────────────────────────────────────────────

    // Use refs so socket handlers always call the latest version
    const endCallRef = useRef(null);

    const endCall = useCallback((reason) => {
        cleanup();
        stopLocalStream();
        setState(STATES.IDLE);
        setRoomId(null);
        setChallenge(null);
        if (reason) setError(reason);
    }, [cleanup, stopLocalStream]);

    endCallRef.current = endCall;

    const joinQueue = useCallback(async () => {
        setError(null);
        try {
            await startLocalStream();
        } catch {
            setError('Camera/microphone access denied. Please allow it and try again.');
            return;
        }
        socket.emit('join_queue', {});
    }, [startLocalStream]);

    const skip = useCallback(() => {
        if (roomId) socket.emit('skip', { roomId });
        endCall(null);
    }, [roomId, endCall]);

    const leaveQueue = useCallback(() => {
        socket.emit('leave_queue');
        stopLocalStream();
        setState(STATES.IDLE);
    }, [stopLocalStream]);

    // ── Socket lifecycle ──────────────────────────────────────────────────────

    useEffect(() => {
        socket.connect();

        const onAssignedId = ({ userId: id }) => setUserId(id);

        // Guard: never downgrade from IN_CALL (race between queue_joined and match_found)
        const onQueueJoined = () => setState(prev => prev === STATES.IN_CALL ? prev : STATES.QUEUED);

        const onMatchFound = async ({ roomId: rid, challenge: ch, isInitiator }) => {
            setRoomId(rid);
            setChallenge(ch);
            setState(STATES.IN_CALL);
            // startLocalStream is idempotent — returns cached stream if already running
            const stream = localStreamRef.current || await startLocalStream();
            await startCall(rid, isInitiator, stream);
        };

        const onOffer = async (offer) => {
            await handleOffer(offer);
        };

        const onAnswer = (answer) => handleAnswer(answer);

        const onIce = (candidate) => handleIceCandidate(candidate);

        const onPartnerDisconnected = () => endCallRef.current('Your partner disconnected.');
        const onPartnerSkipped     = () => endCallRef.current('Your partner skipped.');

        const onError = ({ message }) => setError(message);

        socket.on('assigned_id',         onAssignedId);
        socket.on('queue_joined',         onQueueJoined);
        socket.on('match_found',          onMatchFound);
        socket.on('webrtc_offer',         onOffer);
        socket.on('webrtc_answer',        onAnswer);
        socket.on('webrtc_ice_candidate', onIce);
        socket.on('partner_disconnected', onPartnerDisconnected);
        socket.on('partner_skipped',      onPartnerSkipped);
        socket.on('error',                onError);

        return () => {
            // Remove specific handlers so StrictMode double-mount doesn't
            // register duplicate listeners
            socket.off('assigned_id',         onAssignedId);
            socket.off('queue_joined',         onQueueJoined);
            socket.off('match_found',          onMatchFound);
            socket.off('webrtc_offer',         onOffer);
            socket.off('webrtc_answer',        onAnswer);
            socket.off('webrtc_ice_candidate', onIce);
            socket.off('partner_disconnected', onPartnerDisconnected);
            socket.off('partner_skipped',      onPartnerSkipped);
            socket.off('error',                onError);
            socket.disconnect();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="app">
            <header className="header">
                <h1>RandoM337</h1>
                <p className="subtitle">Random video chat with a challenge</p>
            </header>

            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <main className="main">
                {state === STATES.IN_CALL && (
                    <div className="video-area">
                        <div className="videos">
                            <div className="video-wrapper remote">
                                <video ref={remoteVideoRef} autoPlay playsInline />
                                <span className="label">Partner</span>
                            </div>
                            <div className="video-wrapper local">
                                <video ref={localVideoRef} autoPlay playsInline muted />
                                <span className="label">You</span>
                            </div>
                        </div>

                        {challenge && (
                            <div className="challenge-box">
                                <span className="challenge-label">Challenge</span>
                                <p>{challenge.text}</p>
                            </div>
                        )}

                        <div className="call-controls">
                            <button className="btn btn-danger" onClick={skip}>Skip</button>
                        </div>
                    </div>
                )}

                {state === STATES.QUEUED && (
                    <div className="video-area">
                        <div className="videos">
                            <div className="video-wrapper local-full">
                                <video ref={localVideoRef} autoPlay playsInline muted />
                                <span className="label">You</span>
                            </div>
                        </div>
                        <div className="waiting-spinner">
                            <div className="spinner" />
                            <p>Finding you a match…</p>
                        </div>
                        <div className="call-controls">
                            <button className="btn btn-secondary" onClick={leaveQueue}>Cancel</button>
                        </div>
                    </div>
                )}

                {state === STATES.IDLE && (
                    <div className="landing">
                        <p className="landing-desc">
                            Press <strong>Start</strong> to be matched with a random stranger.<br />
                            Each session comes with a fun challenge to break the ice.
                        </p>
                        <button className="btn btn-primary" onClick={joinQueue}>Start</button>
                        {userId && <p className="user-id">Your ID: <code>{userId.slice(0, 8)}…</code></p>}
                    </div>
                )}
            </main>
        </div>
    );
}
