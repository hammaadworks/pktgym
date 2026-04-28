/* eslint-disable */

import { useState, useEffect, useRef } from 'react';
import { audio } from '@/lib/audio/audio';
import { PeerMessageSchema } from '../schema';
import { fromError } from 'zod-validation-error';

export function useDesktopPeer(onMenuAction: (data: any) => void, onMotionData: (data: any) => void) {
  const [mounted, setMounted] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [mobileConnected, setMobileConnected] = useState(false);
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);

  // We need to use refs for the callbacks so the peer connection closure
  // always has access to the latest callback functions without re-running the effect
  const onMenuActionRef = useRef(onMenuAction);
  const onMotionDataRef = useRef(onMotionData);

  useEffect(() => {
    onMenuActionRef.current = onMenuAction;
    onMotionDataRef.current = onMotionData;
  }, [onMenuAction, onMotionData]);

  useEffect(() => {
    setMounted(true);
    const newRoom = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomId(newRoom);

    import('peerjs').then(({ default: Peer }) => {
      const peer = new Peer('pktgym-' + newRoom);
      peerRef.current = peer;

      peer.on('open', (id) => {
        console.log('Peer open with ID:', id);
      });

      peer.on('connection', (conn) => {
        connRef.current = conn;
        
        conn.on('open', () => {
          console.log('Mobile connected via PeerJS');
          setMobileConnected(true);
          audio.playClick();
        });

        conn.on('data', (payload: any) => {
          try {
            const message = PeerMessageSchema.parse(payload);
            
            if (message.type === 'menu-action') {
              onMenuActionRef.current(message.data);
            } else if (message.type === 'motion-data') {
              onMotionDataRef.current(message.data);
            }
          } catch (err) {
            const validationError = fromError(err);
            console.error('Invalid Peer Data:', validationError.toString());
          }
        });

        conn.on('close', () => {
          setMobileConnected(false);
          connRef.current = null;
        });
      });
    });

    return () => { 
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const sendStateUpdate = (state: any) => {
    if (connRef.current && mobileConnected) {
      connRef.current.send({
        type: 'state-update',
        data: state
      });
    }
  };

  return {
    mounted,
    roomId,
    mobileConnected,
    sendStateUpdate
  };
}
