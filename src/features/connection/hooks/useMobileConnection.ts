/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { PeerMessageSchema } from '../schema';
import { fromError } from 'zod-validation-error';

export function useMobileConnection(roomId: string | null, onStateUpdate: (state: any) => void) {
  const [mounted, setMounted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState('');
  
  const peerConnRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const onStateUpdateRef = useRef(onStateUpdate);

  useEffect(() => {
    onStateUpdateRef.current = onStateUpdate;
  }, [onStateUpdate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !roomId) return;
    
    const isWebSocket = roomId.startsWith('ws://');

    if (isWebSocket) {
      const ws = new WebSocket(roomId);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to Desktop via WebSocket");
        setConnectionStatus('connected');
        setError('');
        // Tell desktop we connected
        ws.send(JSON.stringify({ type: 'mobile-connected' }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const message = PeerMessageSchema.parse(payload);
          if (message.type === 'state-update') {
            onStateUpdateRef.current(message.data);
          }
        } catch (err) {
           // Ignore
        }
      };

      ws.onclose = () => {
        console.log("Disconnected from Desktop WebSocket");
        setConnectionStatus('disconnected');
        wsRef.current = null;
      };

      ws.onerror = (err) => {
        setConnectionStatus('disconnected');
        setError(`Cannot reach Desktop WebSocket. Ensure you are on the same Wi-Fi.`);
      };

      return () => {
        ws.close();
      };
    } else {
      // Existing PeerJS logic
      import('peerjs').then(({ default: Peer }) => {
        const peer = new Peer();
        
        peer.on('open', (id) => {
          console.log("Peer created with ID", id);
          console.log("Connecting to Desktop ID:", 'pktgym-' + roomId);
          const conn = peer.connect('pktgym-' + roomId, {
            reliable: true
          });

          conn.on('open', () => {
            console.log("Connected to Desktop via PeerJS");
            setConnectionStatus('connected');
            peerConnRef.current = conn;
            setError('');
          });

          conn.on('data', (payload: any) => {
            try {
              const message = PeerMessageSchema.parse(payload);
              if (message.type === 'state-update') {
                onStateUpdateRef.current(message.data);
              }
            } catch (err) {
              const validationError = fromError(err);
              console.error('Invalid Peer Data from Desktop:', validationError.toString());
            }
          });

          conn.on('close', () => {
            console.log("Disconnected from Desktop");
            setConnectionStatus('disconnected');
            peerConnRef.current = null;
          });

          conn.on('error', (err) => {
            console.error("Connection error:", err);
            setConnectionStatus('disconnected');
            peerConnRef.current = null;
            setError(`Cannot reach desktop peer. Make sure both devices are on the same Wi-Fi and the Desktop game is open.`);
          });
        });

        peer.on('error', (err) => {
          console.error("Peer error:", err);
          setConnectionStatus('disconnected');
          setError(`PeerJS Error: ${err.message}`);
        });
      });

      return () => {
        // Peer JS cleanup happens via window unload typically in this setup
      };
    }
  }, [mounted, roomId]);

  const sendData = (type: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    } else if (peerConnRef.current) {
      peerConnRef.current.send({ type, data });
    }
  };

  return { mounted, connectionStatus, error, setError, sendData };
}
