sequenceDiagram
    autonumber
    actor ClientA as User A Frontend
    participant GW as SignalingGateway
    participant MS as MatchmakerService
    participant PM as InMemoryPoolManager
    participant RM as IRoomManager
    actor ClientB as User B Frontend

    %% Matchmaking Phase
    ClientB->>GW: emit('join_queue', preferences)
    GW->>MS: joinQueue(userB, prefs)
    MS->>PM: addPlayer(userB)
    
    ClientA->>GW: emit('join_queue', preferences)
    GW->>MS: joinQueue(userA, prefs)
    MS->>PM: addPlayer(userA)
    
    MS->>PM: processQueue() / findMatch()
    PM-->>MS: returns [UserA, UserB]
    MS->>PM: lockPlayers(UserA, UserB)
    MS->>RM: createRoom(UserA, UserB, Challenge)
    RM-->>MS: returns CallSession (RoomID)
    MS->>PM: removePlayer(UserA), removePlayer(UserB)
    
    MS->>GW: sendEvent('match_found', RoomID, Challenge)
    GW->>ClientA: 'match_found'
    GW->>ClientB: 'match_found'

    %% Signaling Phase (WebRTC)
    ClientA->>ClientA: createOffer()
    ClientA->>GW: emit('webrtc_offer', RoomID, SDP)
    GW->>RM: verifyRoomMembership(UserA, RoomID)
    GW->>ClientB: 'webrtc_offer' (SDP from A)

    ClientB->>ClientB: handleOffer() & createAnswer()
    ClientB->>GW: emit('webrtc_answer', RoomID, SDP)
    GW->>RM: verifyRoomMembership(UserB, RoomID)
    GW->>ClientA: 'webrtc_answer' (SDP from B)

    %% ICE Candidates (Happens concurrently, simplified here)
    ClientA->>GW: emit('ice_candidate', candidate)
    GW->>ClientB: 'ice_candidate'
    ClientB->>GW: emit('ice_candidate', candidate)
    GW->>ClientA: 'ice_candidate'

    Note over ClientA, ClientB: Direct P2P Media Stream Established

