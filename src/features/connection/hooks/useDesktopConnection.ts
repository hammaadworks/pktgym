import { useDesktopPeer } from './useDesktopPeer';
import { useDesktopSocket } from './useDesktopSocket';

export function useDesktopConnection(onMenuAction: (data: any) => void, onMotionData: (data: any) => void) {
  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
  
  const peer = useDesktopPeer(onMenuAction, onMotionData);
  const socket = useDesktopSocket(onMenuAction, onMotionData);

  if (isTauri) {
    return socket;
  }
  return peer;
}
