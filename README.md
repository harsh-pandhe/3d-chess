# ♟️ 3D Multiplayer Chess

A stunning, high-performance 3D multiplayer chess application built with Next.js, React Three Fiber, and Supabase. Features a procedural glassmorphic aesthetic, real-time multiplayer networking, and a heuristic-driven AI fallback powered by Stockfish.

![3D Chess Demo](https://raw.githubusercontent.com/harsh-pandhe/3d-chess/main/public/demo.jpg)

## ✨ Features

- **Immersive 3D Graphics**: Fully interactive 3D chessboard with procedural "glassmorphic" pieces (no heavy 3D asset downloads required by default).
- **Online Multiplayer**: Real-time peer-to-peer networking using Supabase. Share a room link to instantly play with a friend.
- **Stockfish AI**: Challenge the world-class Stockfish engine (runs locally in your browser via WebAssembly).
- **Heuristic Fallback Engine**: If WASM fails, a custom-built heuristic engine steps in to provide a capable fallback AI.
- **Performance Optimized**: Uses conditional Draco compression, single-pass physical materials, and intelligent state-syncing via Zustand to guarantee a buttery smooth 60fps experience.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **3D Engine**: [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Networking**: [Supabase Realtime](https://supabase.com/)
- **Chess Logic**: [chess.js](https://github.com/jhlywa/chess.js) & [stockfish.js](https://github.com/niklasf/stockfish.js)
- **Animations**: [React Spring](https://react-spring.dev/)

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js (v18+) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/3d-chess.git
   cd 3d-chess
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Environment Variables:
   Create a `.env.local` file in the root of the project and add your Supabase credentials to enable Online Multiplayer:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   *(Optional)* If you have optimized Draco `.glb` pieces hosted on Vercel Blob, add:
   ```env
   NEXT_PUBLIC_VERCEL_BLOB_URL=your_blob_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎮 How to Play Online

1. Click **New Game** and select **Online** mode.
2. Hit **Start Game** (you will be assigned as White).
3. The game will generate a unique room link. Click the **🔗 Invite Friend** button in the top left corner to copy the link.
4. Send the link to your friend. When they open it, they will bypass the menu and automatically join the game as Black!

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
