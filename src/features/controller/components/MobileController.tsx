/* eslint-disable */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Smartphone, AlertCircle, Wifi, WifiOff, XCircle, Power, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileConnection } from '@/features/connection/hooks/useMobileConnection';

export default function MobileController() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [activityLevel, setActivityLevel] = useState(0);

  const [desktopState, setDesktopState] = useState<{
    flowState: 'pairing' | 'menu' | 'calibration' | 'transition' | 'playing';
    activeSubMode: string;
    placement: string;
  }>({ flowState: 'pairing', activeSubMode: '', placement: '' });

  const handleStateUpdate = (data: any) => {
    setDesktopState({
      flowState: data.flowState,
      activeSubMode: data.activeSubMode,
      placement: data.placement
    });
  };

  const { mounted, connectionStatus, error, setError, sendData } = useMobileConnection(roomId, handleStateUpdate);

  useEffect(() => {
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }, []);

  const sendMenuAction = (action: string) => {
    if (connectionStatus === 'connected') {
      if (typeof navigator.vibrate === 'function') navigator.vibrate(50);
      sendData('menu-action', { roomId, action });
    }
  };

  const requestPermissionsAndStart = async () => {
    try {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isLocalhost) {
          setError('Motion sensors require a secure HTTPS connection.');
          return;
        }
      }

      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState !== 'granted') {
          setError('Motion sensor permission was denied.');
          return;
        }
      }

      setIsStreaming(true);

      const handleMotion = (event: DeviceMotionEvent) => {
        if (connectionStatus !== 'connected') return;
        
        const ax = event.acceleration?.x || 0;
        const ay = event.acceleration?.y || 0;
        const az = event.acceleration?.z || 0;
        
        const mag = Math.sqrt(ax*ax + ay*ay + az*az);
        setActivityLevel(Math.min(mag / 15, 1));

        const orientation = (window as any).lastOrientation || { alpha: 0, beta: 0, gamma: 0 };

        sendData('motion-data', {
          roomId,
          accel: { x: ax, y: ay, z: az },
          gyro: {
            alpha: event.rotationRate?.alpha || 0,
            beta: event.rotationRate?.beta || 0,
            gamma: event.rotationRate?.gamma || 0,
          },
          accelGrav: {
            x: event.accelerationIncludingGravity?.x || 0,
            y: event.accelerationIncludingGravity?.y || 0,
            z: event.accelerationIncludingGravity?.z || 0,
          },
          orientation: orientation,
          timestamp: Date.now()
        });
      };

      const handleOrientation = (event: DeviceOrientationEvent) => {
        (window as any).lastOrientation = {
          alpha: event.alpha || 0,
          beta: event.beta || 0,
          gamma: event.gamma || 0,
        };
      };

      window.addEventListener('devicemotion', handleMotion);
      window.addEventListener('deviceorientation', handleOrientation);
    } catch (err: any) {
      console.error("Sensor initialization error:", err);
      setError(err.message || 'Failed to start sensors');
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  if (!roomId) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8">
        <div className="bg-neutral-900 border border-white/5 p-10 rounded-[3rem] text-center space-y-6 max-w-sm w-full shadow-2xl">
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-black text-white uppercase italic">Invalid Link</h2>
          <p className="text-white/40 text-sm font-medium leading-relaxed">The Room ID is missing. Please scan the QR code on your PC again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 overflow-hidden relative font-sans italic">
      <div 
        className="absolute inset-0 transition-opacity duration-150 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, rgba(249, 115, 22, ${activityLevel * 0.4}) 0%, transparent 70%)`
        }}
      />

      <div className="z-10 w-full max-w-sm flex flex-col items-center gap-12">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
             <div className={cn(
               "w-2.5 h-2.5 rounded-full",
               connectionStatus === 'connected' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500 animate-pulse"
             )} />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
               {connectionStatus === 'connected' ? 'Uplink Established' : 'System Offline'}
             </span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter leading-none uppercase italic">Controller</h1>
          <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full inline-block">
            <p className="text-orange-500 font-mono text-xs font-bold tracking-widest uppercase">Room: {roomId}</p>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-[2.5rem] w-full shadow-lg flex flex-col gap-4 mb-4"
            >
              <div className="flex items-center gap-3">
                <WifiOff className="w-6 h-6 text-red-500" />
                <p className="text-xs font-black uppercase tracking-widest text-red-500">Diagnostic Failure</p>
              </div>
              <p className="text-xs font-bold leading-relaxed opacity-70 italic">{error}</p>
              <button 
                onClick={() => setError('')}
                className="mt-2 w-full py-3 bg-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-colors"
              >
                Continue without motion
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isStreaming ? (
          <div className="flex flex-col items-center gap-10 w-full">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              disabled={connectionStatus !== 'connected'}
              onClick={requestPermissionsAndStart}
              className={cn(
                "w-full aspect-square max-w-[240px] rounded-[4rem] text-3xl font-black shadow-2xl flex flex-col items-center justify-center gap-3 transition-all duration-500 group relative overflow-hidden italic border-8",
                connectionStatus === 'connected' 
                  ? "bg-orange-500 text-white border-orange-400/50 shadow-[0_0_40px_rgba(249,115,22,0.4)]" 
                  : "bg-white/5 text-white/10 border-white/5"
              )}
            >
              <Activity className={cn(
                "w-20 h-16 relative z-10 transition-transform duration-500 group-hover:scale-110",
                connectionStatus === 'connected' ? "opacity-100" : "opacity-20"
              )} />
              <span className="relative z-10 tracking-tight">ENGAGE</span>
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-between w-full h-full pb-8">
            <div className="w-full flex justify-between items-center bg-[#0f172a] border border-white/5 p-4 rounded-3xl shadow-xl relative overflow-hidden mt-4">
               <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/10">
                  <motion.div 
                    className="h-full bg-orange-500 shadow-[0_0_15px_#f97316]"
                    animate={{ width: ["0%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              <div className="flex items-center gap-2 text-green-400">
                <Wifi className="w-4 h-4 animate-pulse" />
                <span className="text-xs font-black uppercase italic tracking-widest">Live</span>
              </div>
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                {desktopState.flowState === 'menu' ? 'Menu' : desktopState.activeSubMode.replace('_', ' ')}
              </div>
            </div>

            {desktopState.flowState === 'menu' || desktopState.flowState === 'pairing' ? (
              <div className="flex flex-col items-center justify-center flex-1 w-full gap-8">
                <p className="text-xs text-white/30 font-black uppercase tracking-[0.4em] text-center italic">Remote Navigation</p>
                <div className="grid grid-cols-3 gap-3 p-6 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-md shadow-inner relative w-full max-w-[300px]">
                  <div className="col-start-2">
                    <button onClick={() => sendMenuAction('up')} className="w-full aspect-square bg-white/10 hover:bg-white/20 active:bg-orange-500/50 rounded-2xl flex items-center justify-center transition-colors">
                      <ChevronUp className="w-8 h-8" />
                    </button>
                  </div>
                  <div className="col-start-1 row-start-2">
                    <button onClick={() => sendMenuAction('left')} className="w-full aspect-square bg-white/10 hover:bg-white/20 active:bg-orange-500/50 rounded-2xl flex items-center justify-center transition-colors">
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                  </div>
                  <div className="col-start-2 row-start-2">
                    <button onClick={() => sendMenuAction('enter')} className="w-full aspect-square bg-orange-500/20 hover:bg-orange-500/40 border-2 border-orange-500/50 active:bg-orange-500 rounded-2xl flex items-center justify-center transition-all text-orange-500 active:text-white">
                      <Target className="w-7 h-7" />
                    </button>
                  </div>
                  <div className="col-start-3 row-start-2">
                    <button onClick={() => sendMenuAction('right')} className="w-full aspect-square bg-white/10 hover:bg-white/20 active:bg-orange-500/50 rounded-2xl flex items-center justify-center transition-colors">
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </div>
                  <div className="col-start-2 row-start-3">
                    <button onClick={() => sendMenuAction('down')} className="w-full aspect-square bg-white/10 hover:bg-white/20 active:bg-orange-500/50 rounded-2xl flex items-center justify-center transition-colors">
                      <ChevronDown className="w-8 h-8" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 w-full gap-10">
                <div className="relative w-64 h-64 flex items-center justify-center">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-[4rem] border-2 border-orange-500/20 pointer-events-none"
                      animate={{ scale: [1, 2], opacity: [0.6, 0], rotate: i * 45 }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
                    />
                  ))}
                  
                  <motion.div 
                    className="w-36 h-36 bg-orange-500 rounded-[2.5rem] shadow-[0_0_60px_rgba(249,115,22,0.5)] flex flex-col items-center justify-center z-10 border-[6px] border-orange-400/30 gap-2"
                    animate={{ scale: 1 + (activityLevel * 0.3), rotate: activityLevel * 8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Activity className="w-12 h-12 text-white drop-shadow-lg" />
                  </motion.div>
                </div>
                
                {desktopState.placement && (
                  <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-md w-full text-center">
                    <p className="text-xs text-orange-500 font-black uppercase tracking-[0.3em] mb-1 italic">Placement</p>
                    <p className="text-sm font-bold text-white/80 uppercase tracking-widest">{desktopState.placement}</p>
                  </div>
                )}
              </div>
            )}

            <div className="w-full flex gap-4 mt-auto">
               <button 
                onClick={() => sendMenuAction('escape')}
                className="flex-1 flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 active:bg-orange-500/20 border border-white/10 rounded-[2rem] text-white/50 hover:text-white transition-all font-black uppercase tracking-widest text-[10px] italic"
              >
                <Target className="w-6 h-6" />
                Menu
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 flex flex-col items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/40 border border-red-500/20 rounded-[2rem] text-red-400 transition-all font-black uppercase tracking-widest text-[10px] italic"
              >
                <Power className="w-6 h-6" />
                Terminate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}