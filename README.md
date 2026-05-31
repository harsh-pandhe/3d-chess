<div align="center">

# ♟️ 3D Chess

**A stunning, real-time multiplayer chess experience in your browser.**

[![Live Demo](https://img.shields.io/badge/▶_Play_Now-3d--chess--beryl.vercel.app-blue?style=for-the-badge&logo=vercel)](https://3d-chess-beryl.vercel.app)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.184-049ef4?style=flat-square&logo=three.js)](https://threejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

<img src="public/screenshots/hero.png" alt="3D Chess — Glass pieces on a cinematic board" width="700" />

<br />

*Glassmorphic 3D pieces · Stockfish AI · Online Multiplayer · Zero downloads*

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎮 Three Game Modes
- **Local** — Hotseat play on the same device
- **vs AI** — Four difficulty levels (Beginner → Master)
- **Online** — Share a link & play with anyone in the world

</td>
<td width="50%">

### ♔ Full Chess Rules
- Castling (kingside & queenside)
- En passant captures
- Pawn promotion with piece picker
- Check, checkmate, stalemate & draw detection

</td>
</tr>
<tr>
<td width="50%">

### 🌐 Real-Time Multiplayer
- Powered by Supabase Realtime Broadcast
- Ultra-low bandwidth — moves sent as 4-char UCI strings
- One-click invite link sharing
- Synced resignation & rematch events

</td>
<td width="50%">

### ⚡ Performance First
- Procedural geometry — no heavy 3D model downloads
- Single-pass `meshPhysicalMaterial` (not transmission)
- `frameloop="demand"` — GPU only renders when needed
- Zustand `subscribeWithSelector` for zero wasted re-renders

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Webpack) |
| **3D Rendering** | [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) |
| **Post-processing** | [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) (Bloom, Vignette) |
| **State** | [Zustand](https://github.com/pmndrs/zustand) with `subscribeWithSelector` |
| **Animations** | [React Spring](https://react-spring.dev/) (spring physics for piece movement) |
| **Networking** | [Supabase Realtime](https://supabase.com/) (Broadcast channels) |
| **Chess Engine** | [chess.js](https://github.com/jhlywa/chess.js) with stable bitwise piece IDs |
| **AI** | [Stockfish WASM](https://github.com/niklasf/stockfish.js) + custom heuristic fallback |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│                   Next.js App                    │
│                                                  │
│  ┌──────────┐   ┌───────────┐   ┌────────────┐  │
│  │ ChessApp │──▶│ GameHUD   │   │ NewGameMenu│  │
│  │ (client) │   │ (2D React)│   │ (2D React) │  │
│  └────┬─────┘   └───────────┘   └────────────┘  │
│       │                                          │
│       ▼                                          │
│  ┌──────────────────────────┐                    │
│  │     ChessScene (R3F)     │                    │
│  │  ┌────────┐ ┌──────────┐ │                    │
│  │  │Board3D │ │Piece3D×32│ │                    │
│  │  └────────┘ └──────────┘ │                    │
│  └──────────────────────────┘                    │
│       │              │                           │
│       ▼              ▼                           │
│  ┌─────────┐   ┌───────────┐   ┌─────────────┐  │
│  │ Zustand  │◀─│  Engine   │   │  Stockfish  │  │
│  │  Store   │  │ (chess.js)│   │  (WASM/Web  │  │
│  │          │──│           │──▶│   Worker)    │  │
│  └────┬─────┘  └───────────┘   └─────────────┘  │
│       │                                          │
│       ▼                                          │
│  ┌──────────────────┐                            │
│  │  useMultiplayer   │◀──▶ Supabase Realtime     │
│  │  (UCI broadcast)  │    (WebSocket channels)   │
│  └──────────────────┘                            │
└──────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and **npm**

### Installation

```bash
# Clone the repository
git clone https://github.com/harsh-pandhe/3d-chess.git
cd 3d-chess

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables (Optional)

Create a `.env.local` file to enable **Online Multiplayer**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

> **Note:** The app works perfectly without these — Local and AI modes are fully offline. Only set these if you want the Online mode.

---

## 🎮 How to Play

### Local Mode
1. Select **Local** → choose a time control → **Start Game**
2. White and Black take turns on the same screen
3. Click a piece to see valid moves, then click a destination

### vs AI
1. Select **vs AI** → pick difficulty & your color → **Start Game**
2. The AI will respond automatically after your move

### Online Multiplayer
1. Select **Online** → pick your color → **Start Game**
2. Click **🔗 Invite Friend** in the top bar to copy the room link
3. Send the link to your friend — they'll auto-join as the opposite color
4. Play in real-time across the internet!

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with Inter font
│   ├── page.tsx            # Entry point with Suspense boundary
│   └── globals.css         # Global styles & CSS reset
├── components/
│   ├── ChessApp.tsx        # Main orchestrator (hooks + layout)
│   ├── 3d/
│   │   ├── ChessScene.tsx  # R3F Canvas, lighting, post-processing
│   │   ├── ChessBoard3D.tsx# Board squares, highlights, glass layer
│   │   ├── ChessPiece3D.tsx# Animated piece with spring physics
│   │   └── piece-geometry.ts # Procedural lathe/extrude geometries
│   └── ui/
│       ├── GameHUD.tsx     # Timers, status, moves, captured pieces
│       └── NewGameMenu.tsx # Mode selection, time controls
├── engine/
│   ├── chess-engine.ts     # chess.js wrapper with stable piece IDs
│   └── types.ts            # Shared types & bitwise ID encoding
├── hooks/
│   ├── useStockfish.ts     # Stockfish WASM Web Worker management
│   ├── useGameTimer.ts     # requestAnimationFrame chess clocks
│   └── useMultiplayer.ts   # Supabase Realtime networking
└── store/
    └── game-store.ts       # Zustand store with subscribeWithSelector
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[Play Now →](https://3d-chess-beryl.vercel.app)**

Made with ♟️ by [Harsh Pandhe](https://github.com/harsh-pandhe)

</div>
