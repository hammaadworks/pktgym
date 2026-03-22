import { useState, useEffect, useRef } from 'react';
import { audio } from '@/lib/audio/audio';
import { PeerMessageSchema } from '../schema';
import { fromError } from 'zod-validation-error';

export function useDesktopSocket(onMenuAction: (data: any) => void, onMotionData: (data: any) => void) {
  const [mounted, setMounted] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [mobileConnected, setMobileConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const onMenuActionRef = useRef(onMenuAction);
  const onMotionDataRef = useRef(onMotionData);

  useEffect(() => {
    onMenuActionRef.current = onMenuAction;
    onMotionDataRef.current = onMotionData;
  }, [onMenuAction, onMotionData]);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined' || !(window as any).__TAURI__) return; // Skip if not Tauri
    
    // Use Tauri API to get local IP if available
    const initSocket = async () => {
      let wsUrl = 'ws://localhost:8899';
      try {
        if ((window as any).__TAURI__ && (window as any).__TAURI__.invoke) {
          wsUrl = await (window as any).__TAURI__.invoke('get_local_ip');
        }
      } catch (e) {
        console.error("Tauri invoke failed, falling back to localhost", e);
      }
      
      setRoomId(wsUrl); // Use URL as room ID for QR

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Local WebSocket server connected at', wsUrl);
        // We don't set mobileConnected true here, because this is just us connecting to our own local server.
        // We need a specific message from mobile to confirm.
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'mobile-connected') {
             console.log('Mobile connected via WebSocket');
             setMobileConnected(true);
             audio.playClick();
             return;
          }

          const message = PeerMessageSchema.parse(payload);
          
          if (message.type === 'menu-action') {
            onMenuActionRef.current(message.data);
          } else if (message.type === 'motion-data') {
            onMotionDataRef.current(message.data);
          }
        } catch (err) {
          // Ignore invalid messages
        }
      };

      ws.onclose = () => {
        setMobileConnected(false);
      };
    };

    initSocket();

    return () => { 
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendStateUpdate = (state: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && mobileConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'state-update',
        data: state
      }));
    }
  };

  return { mounted, roomId, mobileConnected, sendStateUpdate };
}
