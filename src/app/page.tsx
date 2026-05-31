import { Suspense } from 'react';
import ChessApp from '@/components/ChessApp';

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Suspense fallback={<div style={{ color: 'white', padding: 20 }}>Loading Game...</div>}>
        <ChessApp />
      </Suspense>
    </main>
  );
}
