import React, { useRef, useEffect } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { Video, VideoOff, RefreshCw, PhoneOff, Zap } from 'lucide-react';
import './index.css';

function App() {
  const { localStream, remoteStream, status, findPartner, skipPartner, nextPartner } = useWebRTC();
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <Zap size={28} color="#60a5fa" />
          <span>ChatRoulette</span>
        </div>
      </header>

      <main className="video-area">
        <div className="remote-video-container">
          {remoteStream ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="video-element"
            />
          ) : (
            <div className="status-overlay">
              {status === 'waiting' && (
                <>
                  <div className="loader"></div>
                  <div className="status-text">Looking for someone...</div>
                </>
              )}
              {status === 'connecting' && (
                  <>
                  <div className="loader"></div>
                  <div className="status-text">Connecting...</div>
                </>
              )}
              {(status === 'idle' || status === 'error') && (
                <div className="status-text" style={{ padding: '0 2rem', maxWidth: '400px' }}>
                  <h2 style={{fontSize: '2rem', marginBottom: '1rem'}}>Ready to chat?</h2>
                  <p style={{opacity: 0.8, fontSize: '1.1rem', marginBottom: '2rem'}}>Click Start Chatting to meet random people and make new friends.</p>
                  <button className="btn btn-primary" onClick={findPartner} style={{ fontSize: '1.2rem', padding: '1rem 2rem', margin: '0 auto' }}>
                    <Video size={24} />
                    Start Chatting
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Local Video Container */}
        {localStream && (
          <div className="local-video-container">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="video-element"
            />
          </div>
        )}
      </main>

      {/* Controls Overlay */}
      {status !== 'idle' && status !== 'error' && (
        <div className="controls-overlay">
          <button className="btn btn-danger btn-icon" onClick={skipPartner} title="Stop Chat">
            <PhoneOff size={24} />
          </button>
          <button className="btn btn-primary" onClick={nextPartner}>
            <RefreshCw size={20} />
            Skip & Next
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
