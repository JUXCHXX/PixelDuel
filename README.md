# PixelDuel 🎮

A retro arcade multiplayer game platform with 6 different games, featuring local co-op and online multiplayer support via Firebase and WebRTC.

## Features

- **6 Arcade Games**: Pong, Snake, Tetris, Wordle, Bomberman, Racing
- **Local 2-Player**: Play on the same machine
- **Online Multiplayer**: Real-time matchmaking with presence system
- **User Accounts**: Firebase authentication with persistent profiles
- **Avatar System**: 8 unique pixel-art avatars
- **Invite System**: Send/receive game invitations with timeout management
- **Real-time Presence**: See who's online and what they're playing
- **Stats Tracking**: Win/loss records and player statistics
- **Responsive Design**: Works on desktop and tablets

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Firebase project (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/pixelduel.git
cd pixelduel
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase**

   a. Go to [Firebase Console](https://console.firebase.google.com)
   
   b. Create a new project
   
   c. Enable these services:
      - Authentication → Email/Password
      - Firestore Database (Production mode)
      - Realtime Database
   
   d. Get your configuration:
      - Project Settings → Your apps → Web
      - Copy the Firebase config
   
   e. Update `src/lib/firebaseConfig.ts` with your credentials:
   ```typescript
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com"
   };
   ```

4. **Configure Firestore Rules**

   In Firebase Console → Firestore Database → Rules → Replace with `firestore.rules`:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read: if request.auth != null;
         allow write: if request.auth.uid == uid;
       }
       // See firestore.rules for complete rules
     }
   }
   ```

5. **Configure Realtime Database Rules**

   In Firebase Console → Realtime Database → Rules:
   ```json
   {
     "rules": {
       "presence": {
         ".read": "auth != null",
         ".write": "auth != null"
       }
     }
   }
   ```

### Development

```bash
npm run dev
```

The app will start at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview  # Test the production build
```

## Game Controls

### Local Games

**Player 1**: W/A/S/D (movement), Space (action), Shift (action 2)
**Player 2**: Arrow Keys (movement), Enter (action), Ctrl-Right (action 2)

### Games

- **Pong**: Paddle each side, bounce the ball
- **Snake**: Collect food, don't hit walls or yourself
- **Tetris**: Classic Tetris, best-of-3 format
- **Wordle**: Guess the word in 6 attempts
- **Bomberman**: Classic bomb-placing action
- **Racing**: Top-down racing with obstacles

## Online Features

### Create Account
- Register with email and choose a unique username
- Select from 8 pixel-art avatars
- Password must be at least 6 characters

### Play Online
1. Click "PLAY ONLINE" from the menu
2. Log in or create an account
3. Browse online players
4. Send invitations to other players
5. Accept/decline invitations
6. Select a game and play
7. Stats are automatically tracked

### Invitations
- Invitations expire after 30 seconds of no response
- You can have max 3 pending invitations
- Real-time notifications for incoming invites
- Automatic room code generation for matched players

## Project Structure

```
pixelduel/
├── src/
│   ├── components/
│   │   ├── AuthScreen.tsx          # Login/Register UI
│   │   ├── OnlineLobby.tsx         # Player list & invites
│   │   ├── ProfileScreen.tsx       # User stats & avatar
│   │   ├── NotificationCenter.tsx  # Toast notifications
│   │   ├── GameCanvas.tsx          # Game renderer
│   │   ├── GameSelector.tsx        # Game picker
│   │   ├── Scoreboard.tsx          # Local scores
│   │   └── ...UI components
│   ├── services/
│   │   ├── AuthManager.ts          # Firebase Auth logic
│   │   ├── PresenceManager.ts      # Real-time presence
│   │   ├── InviteManager.ts        # Invite system
│   │   ├── AvatarManager.ts        # Avatar generation
│   │   └── ...Business logic
│   ├── context/
│   │   ├── AuthContext.tsx         # User auth state
│   │   └── NotificationContext.tsx # Toast state
│   ├── engine/
│   │   ├── NetworkManager.ts       # P2P via PeerJS
│   │   ├── SoundManager.ts         # Audio effects
│   │   ├── InputManager.ts         # Keyboard input
│   │   └── ScoreManager.ts         # Local persistence
│   ├── games/
│   │   ├── Pong.ts
│   │   ├── Snake.ts
│   │   ├── Tetris.ts
│   │   ├── Bomberman.ts
│   │   ├── Racing.ts
│   │   └── Wordle.ts
│   ├── lib/
│   │   ├── firebase.ts             # Firebase initialization
│   │   └── firebaseConfig.ts       # Configuration (with placeholders)
│   └── pages/
│       └── Index.tsx               # Main app/routing
├── firestore.rules                 # Firestore security rules
└── README.md
```

## Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Game Engine**: HTML5 Canvas, Web Audio API
- **Networking**: PeerJS (WebRTC)
- **Backend**: Firebase (Auth, Firestore, Realtime DB)
- **Build**: Vite
- **UI Components**: shadcn/ui

## Features in Detail

### Authentication
- Email/password registration and login
- Username uniqueness verification
- Persistent sessions via Firebase Auth
- Password reset functionality

### Multiplayer
- Real-time player presence
- Status tracking (online, in-game, away)
- Game invitations with countdown timers
- Automatic room code generation for P2P connection

### Statistics
- Win/loss tracking per player
- Game count per player
- Win ratio percentage
- Game favoriting (most-played)

### UI/UX
- Retro arcade aesthetic with neon effects
- Smooth animations and transitions
- Real-time search and filtering
- Touch-friendly buttons and spacing
- Responsive design

## Troubleshooting

### "Firebase initialization error"
- Check your `firebaseConfig.ts` has all required fields
- Verify the credentials match your Firebase project
- Ensure Firebase project has Auth, Firestore, and Realtime DB enabled

### "Username already taken"
- All usernames are globally unique
- Try adding numbers or underscores to your preferred name

### "Connection failed" during online play
- Check both players have stable internet
- Verify PeerJS is loading (check browser console)
- Try closing and reopening the invitation

### Game not loading
- Clear browser cache
- Check browser console for error messages
- Ensure all game assets are loading correctly

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

Built with ❤️ using React, Firebase, and love for retro gaming.

---

**Have fun playing PixelDuel!** 🎮✨
