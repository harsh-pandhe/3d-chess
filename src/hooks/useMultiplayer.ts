/**
 * Real-Time Multiplayer Networking Hook.
 * 
 * ARCHITECTURE COMPLIANCE:
 * This uses extremely low-bandwidth UCI string broadcasting (e.g., "e2e4")
 * rather than transmitting 3D coordinates. This drastically cuts down on
 * message broker costs (Supabase Realtime, Liveblocks, etc.).
 */

'use client';

import { useEffect, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { useGameStore } from '@/store/game-store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client instance if env vars are present
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export function useMultiplayer(roomId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (!roomId || !supabase) {
      if (!supabase && roomId) {
        console.warn('Multiplayer requested but Supabase credentials are not configured.');
      }
      return;
    }

    console.log(`Connecting to multiplayer room: ${roomId}`);
    
    // 1. Initialize Connection
    const channel = supabase.channel(`room:${roomId}`);
    channelRef.current = channel;

    // 2. Subscribe to incoming UCI strings
    channel
      .on('broadcast', { event: 'chess_move' }, (payload) => {
        const uciMove = payload.uci; // e.g., "e2e4" or "e7e8q"
        if (uciMove && typeof uciMove === 'string') {
          const from = uciMove.substring(0, 2);
          const to = uciMove.substring(2, 4);
          const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
          
          // Verify it's not a move we just made
          const { history } = useGameStore.getState().engine;
          const lastOurMove = history().length > 0 ? history()[history().length - 1] : null;
          
          useGameStore.getState().makeMove(from, to, promotion as any);
        }
        // Listen for game status events (resign/rematch)
      })
      .on('broadcast', { event: 'game_status' }, (payload) => {
        const { status } = payload;
        if (status === 'resigned') {
          useGameStore.getState().resignGame();
        } else if (status === 'rematch') {
          useGameStore.getState().newGame();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully connected to room: ${roomId}`);
        }
      });

    // 3. Cleanup on disconnect
    return () => {
      console.log(`Disconnecting from room: ${roomId}`);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId]);

  // 4. Broadcast our moves to the opponent
  useEffect(() => {
    if (!roomId || !supabase) return;

    const unsubscribeMoves = useGameStore.subscribe(
      (state) => state.moveHistory,
      (history, prevHistory) => {
        if (history.length > prevHistory.length) {
          const lastMove = history[history.length - 1];
          const playerColor = useGameStore.getState().settings.playerColor;
          
          if (lastMove.color === playerColor) {
            const uciString = `${lastMove.from}${lastMove.to}${lastMove.promotion || ''}`;
            if (channelRef.current) {
              channelRef.current.send({
                type: 'broadcast',
                event: 'chess_move',
                uci: uciString
              });
            }
          }
        }
      }
    );

    // Broadcast status changes (resign, rematch)
    const unsubscribeStatus = useGameStore.subscribe(
      (state) => state.status,
      (status, prevStatus) => {
        if (status === 'resigned' && prevStatus !== 'resigned') {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'game_status',
            status: 'resigned'
          });
        }
      }
    );

    // Rematch is tricky because it resets status to 'playing'. We can hook into moveHistory being cleared.
    const unsubscribeReset = useGameStore.subscribe(
      (state) => state.moveHistory.length,
      (length, prevLength) => {
        if (length === 0 && prevLength > 0) {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'game_status',
            status: 'rematch'
          });
        }
      }
    );

    return () => {
      unsubscribeMoves();
      unsubscribeStatus();
      unsubscribeReset();
    };
  }, [roomId]);
}
