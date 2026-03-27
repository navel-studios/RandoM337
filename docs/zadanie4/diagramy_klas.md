```mermaid
classDiagram
    %% Interfaces
    class IUserRepository {
        <<interface>>
        +save(User) Promise~void~
        +findById(String) Promise~User~
        +delete(String) Promise~void~
    }

    class IUserConnection {
        <<interface>>
        +sendEvent(eventName: String, payload: Object)
        +disconnect()
    }

    %% Core Entities
    class User {
        -String id
        -UserSession session
        -UserPreferences preferences
        -UserStats stats
        +getId() String
        +updateSession(UserSession)
        +getPreferences() UserPreferences
    }

    class UserPreferences {
        -List~String~ excludedTags
        -boolean isCameraEnabled
        -boolean isMicEnabled
        +addExcludedTag(String)
        +removeExcludedTag(String)
        +toggleCamera(boolean)
        +toggleMic(boolean)
    }

    class UserStats {
        -int totalConversations
        -int totalMatches
        +incrementConversations()
        +incrementMatches()
    }

    %% State Management
    class UserSession {
        -SessionState state
        -String currentSocketId
        -String activeCallId
        +changeState(SessionState)
        +assignCall(String callId)
        +clearCall()
    }

    class SessionState {
        <<enumeration>>
        IDLE
        QUEUED
        IN_CALL
    }

    %% Managers / Services
    class ConnectionManager {
        -Map~String, IUserConnection~ connections
        -Map~String, String~ socketToUserIdMap
        +registerConnection(String userId, IUserConnection connection)
        +removeConnection(String socketId)
        +getUserConnection(String userId) IUserConnection
    }

    class UserService {
        -IUserRepository repository
        -ConnectionManager connectionManager
        +createUser(String socketId) User
        +handleDisconnect(String socketId)
        +updateUserPreferences(String userId, UserPreferences prefs)
    }

    %% Relationships
    User *-- UserSession : contains
    User *-- UserPreferences : contains
    User *-- UserStats : contains
    UserSession --> SessionState : uses
    UserService ..> IUserRepository : depends on
    UserService ..> ConnectionManager : depends on
    ConnectionManager *-- IUserConnection : manages

    %% Interfaces
    class IPoolManager {
        <<interface>>
        +addPlayer(String userId, UserPreferences prefs) Promise~void~
        +removePlayer(String userId) Promise~void~
        +getWaitingPlayers() Promise~List~PoolEntry~~
        +lockPlayers(String userA, String userB) Promise~boolean~
    }

    class IMatchStrategy {
        <<interface>>
        +findMatch(PoolEntry currentUser, List~PoolEntry~ pool) PoolEntry
    }

    class IRoomManager {
        <<interface>>
        +createRoom(String userA, String userB, Challenge challenge) Promise~CallSession~
        +destroyRoom(String roomId) Promise~void~
        +getRoom(String roomId) Promise~CallSession~
    }

    class IChallengeService {
        <<interface>>
        +getRandomChallenge() Promise~Challenge~
    }

    %% Core Services & Implementations
    class MatchmakerService {
        -IPoolManager poolManager
        -IMatchStrategy matchStrategy
        -IRoomManager roomManager
        -IChallengeService challengeService
        +joinQueue(String userId, UserPreferences prefs)
        +leaveQueue(String userId)
        -processQueue()
    }

    class RandomMatchStrategy {
        +findMatch(PoolEntry currentUser, List~PoolEntry~ pool) PoolEntry
    }

    class TagFilteredMatchStrategy {
        +findMatch(PoolEntry currentUser, List~PoolEntry~ pool) PoolEntry
    }

    class InMemoryPoolManager {
        -Map~String, PoolEntry~ waitingPool
        +addPlayer(String userId, UserPreferences prefs)
        +removePlayer(String userId)
        +lockPlayers(String userA, String userB) boolean
    }

    %% Data Transfer Objects / Aggregates
    class PoolEntry {
        +String userId
        +UserPreferences preferences
        +DateTime joinedAt
        +boolean isLocked
    }

    class CallSession {
        +String roomId
        +String peerA_Id
        +String peerB_Id
        +Challenge activeChallenge
        +DateTime createdAt
        +boolean isActive
    }

    class Challenge {
        +String challengeId
        +String text
        +List~String~ tags
    }

    %% Relationships
    MatchmakerService ..> IPoolManager : depends on
    MatchmakerService ..> IMatchStrategy : depends on
    MatchmakerService ..> IRoomManager : depends on
    MatchmakerService ..> IChallengeService : depends on
    IMatchStrategy <|.. RandomMatchStrategy : implements
    IMatchStrategy <|.. TagFilteredMatchStrategy : implements
    IPoolManager <|.. InMemoryPoolManager : implements
    InMemoryPoolManager *-- PoolEntry : manages
    IRoomManager ..> CallSession : creates

    %% Interfaces from previous sections
    class IRoomManager {
        <<interface>>
        +getRoom(String roomId) Promise~CallSession~
    }
    class ConnectionManager {
        <<service>>
        +getUserConnection(String userId) IUserConnection
    }
    class IUserConnection {
        <<interface>>
        +sendEvent(String eventName, Object payload)
    }

    %% Signaling Core
    class SignalingGateway {
        -SignalingService signalingService
        +handleOffer(String userId, SignalingPayload payload)
        +handleAnswer(String userId, SignalingPayload payload)
        +handleIceCandidate(String userId, SignalingPayload payload)
    }

    class SignalingService {
        -IRoomManager roomManager
        -ConnectionManager connectionManager
        +relayOffer(String senderId, String roomId, Object sdp) Promise~void~
        +relayAnswer(String senderId, String roomId, Object sdp) Promise~void~
        +relayIceCandidate(String senderId, String roomId, Object candidate) Promise~void~
        -verifyRoomMembership(String userId, String roomId) Promise~CallSession~
    }

    %% Data Transfer Objects (DTOs)
    class SignalingPayload {
        +String roomId
        +Object data
    }

    class PeerConnectionClient {
        <<Frontend Concept>>
        -RTCPeerConnection connection
        -MediaStream localStream
        -MediaStream remoteStream
        +createOffer() Promise~void~
        +handleReceiveOffer(Object sdp) Promise~void~
        +addIceCandidate(Object candidate) Promise~void~
    }

    %% Relationships
    SignalingGateway --> SignalingService : uses
    SignalingService ..> IRoomManager : depends on
    SignalingService ..> ConnectionManager : depends on
    SignalingService ..> SignalingPayload : processes
    ConnectionManager *-- IUserConnection : manages

    %% Interfaces
    class IReportRepository {
        <<interface>>
        +saveReport(Report) Promise~void~
        +getPendingReports() Promise~List~Report~~
        +updateStatus(String reportId, String status) Promise~void~
    }

    class IBanRepository {
        <<interface>>
        +saveBan(BanRecord) Promise~void~
        +findActiveBan(String userId) Promise~BanRecord~
    }

    class IChallengeRepository {
        <<interface>>
        +saveChallenge(Challenge) Promise~void~
        +getPendingProposals() Promise~List~Challenge~~
        +updateChallengeStatus(String challengeId, String status) Promise~void~
        +getRandomActiveChallenge() Promise~Challenge~
    }

    class ISanitizationUtility {
        <<interface>>
        +sanitizeHtml(String input) String
        +containsProfanity(String input) boolean
    }

    %% Entities
    class Report {
        +String reportId
        +String reporterId
        +String reportedUserId
        +String reason
        +String screenshotDataUrl
        +String status
        +DateTime createdAt
    }

    class BanRecord {
        +String banId
        +String userId
        +String reason
        +DateTime expiresAt
        +boolean isActive()
    }

    class Challenge {
        +String challengeId
        +String authorId
        +String text
        +String status
    }

    %% Services
    class ModerationService {
        -IReportRepository reportRepo
        -IBanRepository banRepo
        -IRoomManager roomManager
        +submitReport(String reporterId, String reportedId, String reason, String frameData) Promise~void~
        +reviewReport(String adminId, String reportId, boolean isValid, int banHours) Promise~void~
        +verifyUserAccess(String userId) Promise~boolean~
    }

    class ChallengeManagementService {
        -IChallengeRepository challengeRepo
        -ISanitizationUtility sanitizer
        +proposeChallenge(String userId, String text) Promise~void~
        +reviewProposal(String adminId, String challengeId, boolean isApproved, String editedText) Promise~void~
    }

    %% Relationships
    ModerationService ..> IReportRepository : uses
    ModerationService ..> IBanRepository : uses
    ModerationService ..> Report : creates
    ModerationService ..> BanRecord : creates
    ChallengeManagementService ..> IChallengeRepository : uses
    ChallengeManagementService ..> ISanitizationUtility : depends on
    ChallengeManagementService ..> Challenge : manages
