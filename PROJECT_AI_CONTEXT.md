# GuppShup Chat (ChitChatExpress) - Master AI Context & Project Specification

> **Target AI Prompt Feeding Document**: This document contains full technical details, architectural blueprints, database schemas, API routes, socket events, state management structures, and feature roadmaps for the **GuppShup Chat (ChitChatExpress)** application. Feed this document to any AI model to generate accurate code, prompt extensions, or feature implementations.

---

## 1. Project Overview & Tech Stack

**GuppShup Chat** is a high-performance, real-time web messenger built with modern full-stack web technologies.

- **Backend Framework**: Node.js, Express.js (ES Modules syntax with `import`/`export`)
- **Database & ODM**: MongoDB Atlas / Local MongoDB via Mongoose
- **Real-Time Communication**: Socket.IO (`userSocketMap` for multi-tab/device tracking, room management)
- **WebRTC Engine**: Peer-to-Peer Audio & Video Calling (`RTCPeerConnection`, STUN servers, Screen Sharing `getDisplayMedia()`)
- **Integrated AI Assistant & Translator**: GuppShup AI Bot powered by OpenAI (`gpt-4o-mini`) API & Fallback engines
- **Frontend Engine**: React 18, Vite 5, React Router DOM v6
- **Global State Management**: Zustand (`useConversation.js`) + React Context API (`AuthContext`, `SocketContext`, `ThemeContext`, `CallContext`)
- **Styling & UI Design**: Tailwind CSS, DaisyUI v4, Vanilla CSS Custom Glassmorphism Theme System (5 Presets)
- **PWA & Desktop**: Service Worker (`sw.js`), Web Push Notifications (`Notification` API), Manifest (`manifest.json`)
- **Authentication**: JWT stored in HTTP-Only secure cookies (`jwt` cookie) + bcryptjs password hashing

---

## 2. Directory & Architecture Tree

```
ChitChatExpress/
├── backend/
│   ├── .env                            # OPENAI_API_KEY, MONGO_DB_URI, PORT, JWT_SECRET
│   ├── controllers/
│   │   ├── ai.controller.js            # OpenAI GPT-4o-mini chat, translation & smart replies
│   │   ├── auth.controller.js          # Signup, Login, Logout, Me handlers
│   │   ├── group.controller.js         # Group creation, add/remove member handlers
│   │   ├── message.controller.js       # Send/Get messages, upload, react, edit, delete
│   │   └── user.controller.js          # Sidebar user list, profile update, block/unblock
│   ├── db/
│   │   └── connectToMongoDB.js         # MongoDB connection helper
│   ├── middleware/
│   │   ├── protectRoute.js             # JWT authentication middleware
│   │   └── upload.js                   # Multer disk storage middleware (up to 50MB)
│   ├── models/
│   │   ├── conversation.model.js       # Conversation schema (isGroup, disappearingTimer)
│   │   ├── message.model.js            # Message schema (fileUrl, reactions, replyTo, etc.)
│   │   └── user.model.js               # User schema (fullName, username, blockedUsers)
│   ├── routes/
│   │   ├── ai.routes.js                # /api/ai endpoints (chat, smart-replies, translate)
│   │   ├── auth.routes.js              # /api/auth endpoints
│   │   ├── group.routes.js             # /api/groups endpoints
│   │   ├── message.routes.js           # /api/messages endpoints
│   │   └── user.routes.js              # /api/users endpoints
│   ├── socket/
│   │   └── socket.js                   # Socket.IO server, userSocketMap, WebRTC handlers
│   ├── uploads/                        # Static uploaded media directory
│   ├── package.json                    # Backend dependencies (express, socket.io, multer, etc.)
│   └── server.js                       # Express app initialization & SPA fallback
└── frontend/
    ├── public/
    │   ├── manifest.json               # Progressive Web App manifest
    │   └── sw.js                       # Service Worker script
    ├── src/
    │   ├── assets/                     # Sounds & static media
    │   ├── components/
    │   │   ├── messages/
    │   │   │   ├── CallingModal.jsx    # WebRTC Audio/Video call modal & Screen Share
    │   │   │   ├── ChatAnalyticsModal.jsx # Conversation statistics dashboard
    │   │   │   ├── GroupInfoModal.jsx  # Group participants, admin controls & leave group
    │   │   │   ├── MediaLightbox.jsx   # Fullscreen lightbox image/video preview
    │   │   │   ├── Message.jsx         # Custom audio player, reactions, quoted reply, translation, stars
    │   │   │   ├── MessageContainer.jsx# Chat view, Export Chat (.TXT), Header actions
    │   │   │   ├── MessageInput.jsx    # Voice recorder, @mentions, Smart Reply chips
    │   │   │   └── Messages.jsx       # Message feed list & scroll auto-ref
    │   │   ├── sidebar/
    │   │   │   ├── Conversation.jsx    # Sidebar chat item card (Direct, Group, AI Bot, Pinning)
    │   │   │   ├── Conversations.jsx   # Filtered & Pinned sorted list
    │   │   │   ├── CreateGroupModal.jsx# Group creation modal with contact selection
    │   │   │   ├── LogoutButton.jsx    # Logout action trigger
    │   │   │   ├── SearchInput.jsx     # Sidebar search bar
    │   │   │   ├── Sidebar.jsx         # Sidebar header, Theme Switcher, Filter tabs
    │   │   │   └── UserProfileModal.jsx# Profile avatar/bio update modal
    │   │   └── Avatar.jsx              # Avatar component with custom fallback generator
    │   ├── context/
    │   │   ├── AuthContext.jsx         # User auth session provider
    │   │   ├── CallContext.jsx         # WebRTC calling & Screen Share state machine
    │   │   ├── SocketContext.jsx       # Socket.IO client connection & online users
    │   │   └── ThemeContext.jsx        # Glassmorphic theme system provider (5 presets)
    │   ├── hooks/
    │   │   ├── useAI.js                # AI queries, translation, smart replies, blocking hook
    │   │   ├── useGetConversations.js  # Direct contacts fetcher
    │   │   ├── useGroup.js             # Group API operations hook
    │   │   ├── useListenMessages.js    # Realtime message & reaction socket listener
    │   │   ├── useSendMessage.js       # Message & media upload sender hook
    │   │   └── ...
    │   ├── utils/
    │   │   ├── extractTime.js          # HH:MM timestamp formatter
    │   │   └── notification.js         # Web Push desktop notification helper
    │   ├── zustand/
    │   │   └── useConversation.js      # Global state (selectedConversation, messages, replyTo)
    │   ├── App.jsx                     # Root router & theme wrapper
    │   ├── index.css                   # Custom CSS variables, glassmorphism, keyframes
    │   └── main.jsx                    # Entry point & Service Worker registration
    ├── index.html                      # HTML template with PWA manifest & meta tags
    └── package.json                    # Frontend dependencies (vite, tailwindcss, react-icons)
```

---

## 3. Implemented Core & Advanced Features

### Phase 1: Rich Media & Interactive Messaging
- **Voice Notes & Audio Recording**: Browser `MediaRecorder` API recording `.webm` audio notes with duration timer, waveform pulse, and custom waveform audio player in message bubbles.
- **Drag & Drop File Attachments**: Drag & drop file dropzone overlay over `MessageContainer.jsx`, storing files locally under `/uploads` (up to 50MB).
- **Fullscreen Lightbox**: Fullscreen preview for image lightbox, video playback, and document downloads.
- **Emoji Reactions**: Hover action toolbar offering 6 quick reactions (👍, ❤️, 😂, 🔥, 😮, 😢) with real-time socket count sync (`messageReactionUpdated`).
- **Quoted Replies & Message Editing**: Quoted reply block headers and self-message edit/delete endpoints (`/api/messages/edit/:id`, `/api/messages/:id`).

### Phase 2: Group Chats & Community Hubs
- **Group Conversations**: Group creation (`CreateGroupModal.jsx`), multi-user socket emission, and admin controls (`GroupInfoModal.jsx`).
- **Sidebar Tabs & Filter**: Filter tabs ("All", "Direct", "Groups") and "+ Group" button in `Sidebar.jsx`.
- **`@Mention` Auto-Completion**: Typing `@` in group chats displays matching participant handles in an auto-complete popover.

### Phase 3: AI Assistant & Privacy Controls
- **GuppShup AI Bot 🤖**: Virtual contact integrated with **OpenAI (`gpt-4o-mini`)** API & fallback smart responder.
- **Smart Reply Chips**: Generates 3 contextual 1-click response chips above `MessageInput.jsx` based on incoming messages.
- **User Blocking**: Block/Unblock user toggle (`PUT /api/users/block/:id`) with backend authorization enforcement.
- **Disappearing Messages**: Timer dropdown (`Off`, `5m`, `1h`, `24h`) with visual active indicators.

### Phase 4: WebRTC Screen Sharing, Notifications & PWA
- **WebRTC Screen Sharing**: Toggle screen share (`navigator.mediaDevices.getDisplayMedia()`) during video calls via `replaceTrack()`.
- **Native Desktop Notifications**: Web Notification API popup alerts when incoming messages arrive while tab is inactive.
- **PWA Integration**: `manifest.json` and `sw.js` service worker registered in `main.jsx` for desktop app installation.

### Phase 5: Translation, Transcription & Custom Themes
- **🌐 Message Translation**: Translate any message into 8 languages (Spanish 🇪🇸, French 🇫🇷, German 🇩🇪, Hindi 🇮🇳, Japanese 🇯🇵, Chinese 🇨🇳, Arabic 🇸🇦, Russian 🇷🇺) powered by OpenAI API.
- **🎙️ Voice Note Transcription**: 1-click "Transcribe" action on audio notes displaying transcript cards.
- **🎨 5 Glassmorphism Theme Presets**: Dynamic theme switcher (Dark Sapphire 🌌, Neon Cyberpunk ⚡, Midnight Emerald 🌿, Sunset Rose 🌅, AMOLED Black 🖤).

### Phase 6: Pinning, Starred Messages, Export & Analytics
- **📌 Chat Pinning**: Pin top contacts or group hubs to the top of the sidebar with thumbtack badges.
- **⭐ Starred Messages**: Star favorite messages from hover action toolbar with gold star badges.
- **📥 Export Chat History**: Download formatted `.TXT` chat transcripts directly from the header settings.
- **📊 Real-Time Analytics Dashboard**: `ChatAnalyticsModal.jsx` displaying total messages, word count, media attachments count, and voice notes count.

---

## 4. Verification Status

- **Vite Production Build**: Verified via `npm run build --prefix frontend` — **Build Succeeded** (`✓ built in 6.17s`) with 0 errors.
