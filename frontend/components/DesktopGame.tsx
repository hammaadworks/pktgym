/* eslint-disable react-hooks/purity, react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
'use client';

console.log("DesktopGame.tsx module loaded");

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { IMUData, detectMove, GameMode, GAME_MODES, MoveType, tuneConfigWithCalibration, getPeakValues } from '../lib/motionEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_CONFIG, GameConfig } from '../lib/config';
import SettingsModal from './SettingsModal';
import { Settings, RefreshCw, Activity, ArrowRight, Zap, Target, Dumbbell, ShieldAlert, Smartphone, Info, Wifi, Volume2, VolumeX, Flame, HeartPulse, CheckCircle2 } from 'lucide-react';
import { cn, getSocketUrl } from '../lib/utils';
import { audio } from '../lib/audio';
import GameAvatar from './GameAvatar';

type ExtendedMode = GameMode | 'power_workout';

const EXTENDED_MODES: Record<ExtendedMode, { name: string; description: string; icon: any; colorClass: string }> = {
  warmup_core: {
    name: 'Warmup Core',
    description: 'Joint mobility & activation.',
    icon: Flame,
    colorClass: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
  },
  shadow_boxing: {
    name: 'Shadow Boxing',
    description: 'Elite hand-eye coordination drills.',
    icon: Target,
    colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  },
  kickboxing: {
    name: 'Kickboxing',
    description: 'High-impact lower body power.',
    icon: ShieldAlert,
    colorClass: 'text-red-500 bg-red-500/10 border-red-500/20'
  },
  reflex_ridge: {
    name: 'Reflex Ridge',
    description: 'Dynamic obstacle evasion circuit.',
    icon: Activity,
    colorClass: 'text-green-500 bg-green-500/10 border-green-500/20'
  },
  iron_pump: {
    name: 'Iron Pump',
    description: 'Sustained muscular endurance arcs.',
    icon: Dumbbell,
    colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
  },
  cardio_core: {
    name: 'Cardio Core',
    description: 'High intensity full-body blasts.',
    icon: HeartPulse,
    colorClass: 'text-pink-500 bg-pink-500/10 border-pink-500/20'
  },
  power_workout: {
    name: 'Power Workout',
    description: 'The ultimate multi-modal challenge.',
    icon: Zap,
    colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.2)]'
  }
};

export default function DesktopGame() {
  const [mounted, setMounted] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [mobileConnected, setMobileConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDebug, setIsDebug] = useState(false);
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [localIp, setLocalIp] = useState<string>('');
  
  // Debug Data
  const [debugData, setDebugData] = useState<any>(null);

  // Flow State: 'pairing' -> 'menu' -> 'calibration' -> 'transition' -> 'playing'
  const [flowState, setFlowState] = useState<'pairing' | 'menu' | 'calibration' | 'transition' | 'playing'>('pairing');
  
  const [selectedMode, setSelectedMode] = useState<ExtendedMode | null>(null);
  const [activeSubMode, setActiveSubMode] = useState<GameMode>('shadow_boxing');
  const [transitionTime, setTransitionTime] = useState(10);

  // Calibration State
  const [calibrationMoves, setCalibrationMoves] = useState<MoveType[]>([]);
  const [currentCalibIndex, setCurrentCalibIndex] = useState(0);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  
  // Game State
  const [targetMove, setTargetMove] = useState<MoveType>('none');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<'PERFECT' | 'MISS' | 'LATE' | null>(null);
  
  // Menu Focus State
  const [focusedIndex, setFocusedIndex] = useState(0);
  const flowStateRef = useRef(flowState);
  const focusedIndexRef = useRef(focusedIndex);
  
  // Persist socket to use outside useEffect
  const socketRef = useRef<any>(null);

  useEffect(() => {
    flowStateRef.current = flowState;
    if (socketRef.current && mobileConnected) {
      socketRef.current.emit('state-update', {
        roomId,
        flowState,
        activeSubMode,
        placement: GAME_MODES[activeSubMode]?.placement || ''
      });
    }
  }, [flowState, activeSubMode, mobileConnected, roomId]);

  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  }, [focusedIndex]);
  
  // Motion buffer
  const bufferRef = useRef<IMUData[]>([]);
  const isListeningRef = useRef(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const transitionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const calibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Power workout state
  const movesInCurrentMode = useRef(0);

  useEffect(() => {
    console.log("DesktopGame mounting...");
    setMounted(true);
    
    // Fetch Local IP
    fetch('/api/ip')
      .then(res => res.json())
      .then(data => {
        console.log("Local IP fetched:", data.ip);
        setLocalIp(data.ip);
      })
      .catch(err => console.error("Failed to fetch IP:", err));

    const newRoom = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomId(newRoom);

    // Setup Socket
    const socketUrl = getSocketUrl();
    console.log("Desktop attempting connection to:", socketUrl || "current host");
    
    const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        extraHeaders: {
          "ngrok-skip-browser-warning": "true"
        }
    });
    socketRef.current = socket;

    socket.on('connect', () => { 
      socket.emit('join-room', newRoom); 
    });

    socket.on('mobile-connected', () => { 
      setMobileConnected(true);
      if (flowStateRef.current === 'pairing') setFlowState('menu');
      audio.playClick();
    });

    socket.on('menu-action', (data: { action: string }) => {
      audio.playClick();
      
      if (data.action === 'escape') {
        stopWorkout();
        return;
      }

      if (flowStateRef.current !== 'menu') return;
      
      const keys = Object.keys(EXTENDED_MODES) as ExtendedMode[];
      if (data.action === 'down' || data.action === 'right') {
        setFocusedIndex(i => (i + 1) % keys.length);
      } else if (data.action === 'up' || data.action === 'left') {
        setFocusedIndex(i => (i - 1 + keys.length) % keys.length);
      } else if (data.action === 'enter') {
        handleStartWorkout(keys[focusedIndexRef.current]);
      }
    });

    socket.on('motion-data', (data: IMUData) => {
      if (isDebug) setDebugData(data);
      if (!isListeningRef.current) return;
      bufferRef.current.push(data);
      if (bufferRef.current.length > (config.LISTENING_WINDOW_MS / 1000) * 100) {
        bufferRef.current.shift();
      }
    });

    return () => { socket.disconnect(); };
  }, [config.LISTENING_WINDOW_MS, isDebug]);

  useEffect(() => {
    audio.setMuted(isMuted);
  }, [isMuted]);

  const startTransition = (toMode: GameMode) => {
    setFlowState('transition');
    setActiveSubMode(toMode);
    setTransitionTime(10);
    
    if (transitionIntervalRef.current) clearInterval(transitionIntervalRef.current);
    
    transitionIntervalRef.current = setInterval(() => {
      setTransitionTime((prev) => {
        if (prev <= 1) {
          clearInterval(transitionIntervalRef.current!);
          setFlowState('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startCalibration = (mode: ExtendedMode) => {
    setFlowState('calibration');
    audio.playClick();
    
    let subModeToCalibrate: GameMode;
    if (mode === 'power_workout') {
      const modes = Object.keys(GAME_MODES) as GameMode[];
      subModeToCalibrate = modes[Math.floor(Math.random() * modes.length)];
      setActiveSubMode(subModeToCalibrate);
    } else {
      subModeToCalibrate = mode as GameMode;
      setActiveSubMode(subModeToCalibrate);
    }

    const moves = GAME_MODES[subModeToCalibrate].moves;
    setCalibrationMoves(moves);
    setCurrentCalibIndex(0);
    setCalibrationProgress(0);
    isListeningRef.current = true;
    bufferRef.current = [];

    // Simple calibration loop
    if (calibrationIntervalRef.current) clearInterval(calibrationIntervalRef.current);
    calibrationIntervalRef.current = setInterval(() => {
      if (!isListeningRef.current) return;
      
      const peaks = getPeakValues(bufferRef.current);
      // We look for any significant energy to fill the gauge
      const maxEnergy = Math.max(
        Math.abs(peaks.maxX), Math.abs(peaks.maxY), Math.abs(peaks.maxZ),
        peaks.maxAlpha / 10, peaks.maxBeta / 10, peaks.maxGamma / 10
      );

      if (maxEnergy > 5) {
        setCalibrationProgress(p => {
          const newP = p + (maxEnergy * 2);
          if (newP >= 100) {
            // Rep completed
            isListeningRef.current = false;
            // Update config based on what they just did
            setConfig(prev => tuneConfigWithCalibration(prev, moves[currentCalibIndex], peaks));
            
            setTimeout(() => {
              setCalibrationProgress(0);
              setCurrentCalibIndex(idx => {
                const nextIdx = idx + 1;
                if (nextIdx >= moves.length) {
                  clearInterval(calibrationIntervalRef.current!);
                  startTransition(subModeToCalibrate);
                  return idx;
                }
                bufferRef.current = [];
                isListeningRef.current = true;
                return nextIdx;
              });
            }, 1000);
            
            return 100;
          }
          return newP;
        });
      }
      
      // Clear buffer to only get fresh peaks
      if (bufferRef.current.length > 50) bufferRef.current = bufferRef.current.slice(-50);
    }, 500);
  };

  const handleStartWorkout = (mode: ExtendedMode) => {
    setSelectedMode(mode);
    setScore(0);
    setCombo(0);
    movesInCurrentMode.current = 0;
    startCalibration(mode);
  };

  const stopWorkout = () => {
    setFlowState('menu');
    audio.playClick();
    if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    if (transitionIntervalRef.current) clearInterval(transitionIntervalRef.current);
  };

  const nextMove = () => {
    if (flowState !== 'playing' || !selectedMode) return;

    if (selectedMode === 'power_workout') {
      movesInCurrentMode.current += 1;
      if (movesInCurrentMode.current > 10) {
        movesInCurrentMode.current = 0;
        const modes = Object.keys(GAME_MODES) as GameMode[];
        const availableModes = modes.filter(m => m !== activeSubMode);
        const randomMode = availableModes[Math.floor(Math.random() * availableModes.length)];
        startTransition(randomMode);
        return;
      }
    }

    const availableMoves = GAME_MODES[activeSubMode].moves;
    const move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    
    setTargetMove(move);
    setFeedback(null);
    isListeningRef.current = true;
    bufferRef.current = [];
    
    audio.playCallout();

    gameLoopRef.current = setTimeout(() => {
      isListeningRef.current = false;
      const detected = detectMove(activeSubMode, bufferRef.current, config);
      
      if (detected === move) {
        setScore((s) => s + 100 + (combo * 10));
        setCombo((c) => c + 1);
        setFeedback('PERFECT');
        audio.playPerfect();
      } else if (detected !== 'none') {
        setCombo(0);
        setFeedback('MISS');
        audio.playMiss();
      } else {
        setCombo(0);
        setFeedback('LATE');
        audio.playLate();
      }
      
      gameLoopRef.current = setTimeout(nextMove, config.MOVE_INTERVAL_MS);
    }, config.LISTENING_WINDOW_MS);
  };

  useEffect(() => {
    if (flowState === 'playing') {
      setTargetMove('none');
      setFeedback(null);
      const startTimer = setTimeout(nextMove, 1000);
      return () => {
        clearTimeout(startTimer);
        if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
      };
    }
  }, [flowState]);

  // QR Link Calculation
  const protocol = mounted ? window.location.protocol : 'http:';
  const host = mounted ? window.location.host : '';
  const hostname = mounted ? window.location.hostname : '';
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  // If we are on localhost, we try to use the local IP for the QR code so the phone can connect.
  // If we are already on a tunnel/production (not localhost), we use the current host.
  const pairingHost = (isLocalhost && localIp) ? `${localIp}:3000` : host;
  const connectUrl = (mounted && roomId && pairingHost) ? `${protocol}//${pairingHost}/controller?room=${roomId}` : '';

  if (!mounted) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="text-orange-500 font-mono animate-pulse">INITIALIZING SWEATSNAP...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans overflow-hidden selection:bg-orange-500/30 italic">
      {/* Dynamic Immersive Background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-20 pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Persistent Header */}
      <header className="absolute top-0 w-full p-4 md:p-8 flex justify-between items-center z-40">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.3)] border border-white/10 group">
            <Activity className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-white/90 uppercase leading-none text-center">SWEAT <span className="text-orange-500 text-outline">SNAP</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
              <span className="text-[8px] md:text-[10px] font-black text-white/30 uppercase tracking-[0.2em] md:tracking-[0.3em]">System Uplink Active</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <AnimatePresence>
            {mobileConnected && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:flex px-6 py-3 bg-white/5 border border-white/10 rounded-[1.5rem] items-center gap-3 backdrop-blur-2xl"
              >
                <Smartphone className="w-4 h-4 text-green-400" />
                <span className="text-xs font-black text-white/70 uppercase tracking-widest">Link Synchronized</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-1 md:gap-2 p-1 md:p-1.5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl backdrop-blur-md">
            <button
              onClick={() => { setIsDebug(!isDebug); audio.playClick(); }}
              className={cn("p-2 md:p-3 hover:bg-white/10 rounded-lg md:rounded-xl transition-all group", isDebug ? "bg-orange-500/20 text-orange-500" : "text-white/60")}
              title="Toggle Debug Telemetry"
            >
              <Info className="w-4 h-4 md:w-5 md:h-5 group-hover:text-white" />
            </button>
            <button
              onClick={() => { setIsMuted(!isMuted); audio.playClick(); }}
              className="p-2 md:p-3 hover:bg-white/10 rounded-lg md:rounded-xl transition-all group"
            >
              {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5 text-red-500" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-white/60 group-hover:text-white" />}
            </button>
            <button
              onClick={() => { setShowSettings(true); audio.playClick(); }}
              className="p-2 md:p-3 hover:bg-white/10 rounded-lg md:rounded-xl transition-all group"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-white/60 group-hover:text-white group-hover:rotate-90 transition-all duration-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Debug Overlay */}
      <AnimatePresence>
        {isDebug && debugData && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-4 top-24 md:left-8 md:top-32 z-50 bg-black/80 border border-white/10 p-4 rounded-2xl backdrop-blur-md text-xs font-mono text-green-400 space-y-2 pointer-events-none shadow-2xl max-w-[200px] md:max-w-xs break-all"
          >
            <p className="text-orange-500 font-black uppercase tracking-widest mb-2 border-b border-white/10 pb-2">IMU Telemetry</p>
            <p>Accel X: {debugData.accel?.x?.toFixed(2)}</p>
            <p>Accel Y: {debugData.accel?.y?.toFixed(2)}</p>
            <p>Accel Z: {debugData.accel?.z?.toFixed(2)}</p>
            <div className="h-px bg-white/10 my-1" />
            <p>Grav X: {debugData.accelGrav?.x?.toFixed(2)}</p>
            <p>Grav Y: {debugData.accelGrav?.y?.toFixed(2)}</p>
            <p>Grav Z: {debugData.accelGrav?.z?.toFixed(2)}</p>
            <div className="h-px bg-white/10 my-1" />
            <p>Gyro α: {debugData.gyro?.alpha?.toFixed(2)}</p>
            <p>Gyro β: {debugData.gyro?.beta?.toFixed(2)}</p>
            <p>Gyro γ: {debugData.gyro?.gamma?.toFixed(2)}</p>
            <div className="h-px bg-white/10 my-1" />
            <p>Orient α: {debugData.orientation?.alpha?.toFixed(2)}</p>
            <p>Orient β: {debugData.orientation?.beta?.toFixed(2)}</p>
            <p>Orient γ: {debugData.orientation?.gamma?.toFixed(2)}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Experience Engine */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 relative z-10 overflow-y-auto mt-20 md:mt-0 no-scrollbar">
        <AnimatePresence mode="wait">
          {flowState === 'pairing' && (
            <motion.div
              key="pairing"
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(30px)' }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center gap-8 md:gap-12 max-w-5xl w-full"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center w-full">
                <div className="space-y-6 md:space-y-10 text-center lg:text-left">
                  <div className="space-y-4 md:space-y-6">
                    <h2 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic">
                      SYNC YOUR <br />
                      <span className="text-orange-500">GRIT.</span>
                    </h2>
                    <p className="text-lg md:text-2xl text-white/40 font-bold uppercase tracking-wide max-w-md mx-auto lg:mx-0 leading-tight italic">
                      Turn your phone into an elite motion tracking core.
                    </p>
                  </div>
                  
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-4 md:gap-5 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/20">
                        <Wifi className="w-5 h-5 md:w-7 md:h-7 text-blue-400" />
                      </div>
                      <p className="text-xs md:text-sm font-black text-white/60 uppercase tracking-wider leading-snug italic text-left">Establish shared local Wi-Fi between devices.</p>
                    </div>
                    {isLocalhost && (
                      <div className="flex items-start gap-4 md:gap-5 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] bg-orange-500/10 border border-orange-500/20 backdrop-blur-2xl">
                        <Info className="w-5 h-5 md:w-7 md:h-7 text-orange-500 shrink-0 mt-0.5" />
                        <div className="space-y-2 md:space-y-3 text-left">
                          <p className="text-[10px] md:text-xs font-black text-orange-200/80 uppercase tracking-[0.2em] italic leading-none">
                            Local Environment Active
                          </p>
                          <code className="block bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs text-white/80 break-all font-mono border border-white/5 shadow-inner">
                            http://{localIp || 'resolving...'}:3000
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative group mx-auto lg:ml-auto lg:mr-0 w-full max-w-[280px] md:max-w-none md:w-auto mt-4 md:mt-0">
                  <div className="absolute inset-0 bg-orange-500/10 blur-[60px] md:blur-[120px] rounded-full group-hover:bg-orange-500/20 transition-all duration-1000" />
                  <div className="relative bg-[#0f172a]/80 backdrop-blur-3xl p-4 md:p-12 rounded-[2rem] md:rounded-[4.5rem] border border-white/10 shadow-3xl flex flex-col items-center gap-6 md:gap-12">
                    <div className="p-4 md:p-10 bg-white rounded-2xl md:rounded-[3.5rem] shadow-2xl relative group-hover:scale-[1.04] transition-transform duration-700 ease-out w-full flex justify-center">
                      {connectUrl ? (
                        <QRCodeSVG value={connectUrl} size={280} className="w-full max-w-[150px] md:max-w-[280px] h-auto" level="H" />
                      ) : (
                        <div className="w-full max-w-[150px] md:max-w-[280px] aspect-square flex flex-col items-center justify-center gap-4 md:gap-6">
                          <RefreshCw className="w-8 h-8 md:w-12 md:h-12 text-neutral-300 animate-spin" />
                          <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] md:tracking-[0.4em] text-center px-4 md:px-10 leading-relaxed italic">Allocating <br/>Network Stack</p>
                        </div>
                      )}
                    </div>
                    <div className="text-center space-y-2 md:space-y-4 w-full">
                      <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] md:tracking-[0.6em] text-white/20 font-black italic leading-none">Encrypted Uplink</p>
                      <div className="bg-black/40 py-3 px-4 md:py-6 md:px-12 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 shadow-inner">
                        <p className="text-3xl md:text-6xl font-mono tracking-[0.4em] md:tracking-[0.6em] text-orange-500 font-bold ml-[0.4em] md:ml-[0.6em] drop-shadow-[0_0_20px_rgba(249,115,22,0.5)] leading-none italic">{roomId || '----'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {flowState === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
              className="flex flex-col items-center gap-10 md:gap-16 w-full max-w-7xl px-4 mt-24 lg:mt-32"
            >
              <div className="text-center space-y-2 md:space-y-4">
                <h2 className="text-5xl md:text-7xl lg:text-[9rem] font-black tracking-tighter text-white uppercase italic leading-[0.8] mb-4">Target <span className="text-orange-500">Logic.</span></h2>
                <p className="text-sm md:text-xl lg:text-2xl text-white/30 font-black uppercase tracking-[0.4em] md:tracking-[0.6em] italic leading-none">Module parameters synchronized</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 w-full pb-20">
                {(Object.entries(EXTENDED_MODES) as [ExtendedMode, any][]).map(([modeKey, data], index) => {
                  const Icon = data.icon;
                  const isPower = modeKey === 'power_workout';
                  const isFocused = index === focusedIndex;
                  return (
                    <motion.button
                      key={modeKey}
                      whileHover={{ y: -10, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      animate={isFocused ? { y: -10, scale: 1.02, borderColor: "rgba(249,115,22,0.8)" } : { y: 0, scale: 1, borderColor: "rgba(255,255,255,0.05)" }}
                      onClick={() => handleStartWorkout(modeKey)}
                      className={cn(
                        "relative flex flex-col items-start p-8 md:p-10 lg:p-12 rounded-[3rem] md:rounded-[4rem] border-2 bg-white/5 hover:bg-white/[0.08] transition-all text-left overflow-hidden group shadow-3xl backdrop-blur-2xl",
                        isPower ? "sm:col-span-2 xl:col-span-4 bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-purple-500/40" : "",
                        isFocused ? "shadow-[0_0_50px_rgba(249,115,22,0.4)]" : "border-white/5"
                      )}
                    >
                      <div className={cn("p-5 md:p-7 rounded-[2rem] md:rounded-[2.5rem] mb-8 md:mb-12 border-2 transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 shadow-3xl", data.colorClass, isFocused ? "rotate-[15deg] scale-110" : "")}>
                        <Icon className="w-10 h-10 md:w-14 md:h-14" />
                      </div>
                      <h3 className={cn("text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 tracking-tight uppercase leading-none", isFocused ? "text-orange-500" : "")}>{data.name}</h3>
                      <p className="text-white/40 font-black text-[9px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] leading-relaxed md:leading-loose max-w-[200px] md:max-w-[220px]">{data.description}</p>
                      
                      <div className={cn("mt-8 md:mt-12 flex items-center gap-3 md:gap-4 transition-all duration-500", isFocused ? "text-white" : "text-white/20 group-hover:text-white")}>
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] leading-none">Initiate Session</span>
                        <ArrowRight className={cn("w-5 h-5 md:w-6 md:h-6 transition-transform duration-500", isFocused ? "translate-x-0 text-orange-500" : "translate-x-[-8px] group-hover:translate-x-0")} />
                      </div>
                      
                      {isPower && (
                        <div className={cn("absolute right-10 md:right-24 top-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none transition-transform duration-1000 hidden sm:block", isFocused ? "scale-110" : "group-hover:scale-110")}>
                          <Zap className="w-[16rem] h-[16rem] md:w-[32rem] md:h-[32rem] text-purple-500" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {flowState === 'calibration' && (
            <motion.div
              key="calibration"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(30px)' }}
              className="flex flex-col items-center gap-12 w-full max-w-4xl"
            >
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Activity className="w-8 h-8 text-orange-500 animate-pulse" />
                  <p className="text-xl text-orange-500 font-black uppercase tracking-[0.4em] italic leading-none">Sensor Calibration</p>
                </div>
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.85]">
                  Perform <span className="text-orange-500">Move</span>
                </h2>
                <p className="text-lg text-white/50 font-bold uppercase tracking-widest italic max-w-xl mx-auto mt-4">
                  Follow the demo movement until the gauge below is filled to tune the IMU data to your preference.
                </p>
              </div>

              {calibrationMoves[currentCalibIndex] && (
                <div className="relative bg-white/5 border border-white/10 rounded-[3rem] p-16 w-full flex flex-col items-center gap-12 shadow-3xl backdrop-blur-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
                  
                  <div className="flex justify-between items-center w-full px-8">
                    <p className="text-2xl text-white/40 font-black uppercase tracking-widest italic">
                      Move {currentCalibIndex + 1} / {calibrationMoves.length}
                    </p>
                    <p className="text-4xl text-white font-black uppercase tracking-tighter italic">
                      {calibrationMoves[currentCalibIndex].replace('_', ' ')}
                    </p>
                  </div>

                  <div className="scale-75 origin-top mb-[-100px]">
                    <GameAvatar targetMove={calibrationMoves[currentCalibIndex]} feedback={null} />
                  </div>

                  <div className="w-full max-w-2xl space-y-4 z-10">
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-black text-white/60 uppercase tracking-[0.3em] italic">Calibration Data</p>
                      <p className="text-3xl font-black text-orange-500 italic tabular-nums">{Math.min(Math.round(calibrationProgress), 100)}%</p>
                    </div>
                    <div className="w-full h-8 bg-black/50 rounded-full overflow-hidden border border-white/10 shadow-inner p-1">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full shadow-[0_0_20px_#f97316]"
                        animate={{ width: `${Math.min(calibrationProgress, 100)}%` }}
                        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {flowState === 'transition' && (
            <motion.div
              key="transition"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.3, filter: 'blur(50px)' }}
              className="flex flex-col items-center text-center gap-16 max-w-4xl px-8"
            >
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-48 h-48 bg-orange-500 rounded-[3.5rem] flex items-center justify-center shadow-[0_0_120px_rgba(249,115,22,0.6)] border-[12px] border-orange-400/40"
                >
                  <Smartphone className="w-20 h-20 text-white drop-shadow-2xl" />
                </motion.div>
                <motion.div 
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                  className="absolute -right-8 -top-8 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center border-[10px] border-[#020617] font-black text-3xl italic italic"
                >
                  !
                </motion.div>
              </div>
              
              <div className="space-y-8">
                <h2 className="text-4xl font-black uppercase tracking-[0.6em] text-orange-500 italic italic drop-shadow-[0_0_30px_rgba(249,115,22,0.4)] leading-none">Command Pulse</h2>
                <h3 className="text-[9rem] md:text-[13rem] font-black uppercase tracking-tighter leading-[0.75] italic italic text-white drop-shadow-3xl">
                  {GAME_MODES[activeSubMode].name}
                </h3>
              </div>

              <div className="p-16 rounded-[5rem] bg-white/5 border-4 border-white/10 backdrop-blur-[80px] shadow-3xl">
                <p className="text-4xl md:text-6xl font-black text-white leading-[0.9] uppercase tracking-tight italic italic drop-shadow-lg">
                  {GAME_MODES[activeSubMode].placement}
                </p>
              </div>

              <div className="mt-8 flex flex-col items-center gap-8 w-full">
                 <div className="text-[15rem] font-black tabular-nums text-white/5 italic italic leading-none drop-shadow-2xl">
                  {transitionTime}
                </div>
                <div className="w-full max-w-md h-3 bg-white/5 rounded-full overflow-hidden border-2 border-white/5 shadow-inner">
                  <motion.div 
                    className="h-full bg-orange-500 shadow-[0_0_30px_#f97316]"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 10, ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {flowState === 'playing' && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-[95vw] flex flex-col items-center justify-between h-[88vh] px-12"
            >
              <div className="grid grid-cols-3 w-full pt-16 items-start gap-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_20px_#f97316]" />
                    <p className="text-xs font-black tracking-[0.6em] text-white/30 uppercase italic italic leading-none">Impact Force</p>
                  </div>
                  <motion.p
                    key={score}
                    initial={{ scale: 1.2, color: '#f97316' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    transition={{ type: 'spring', stiffness: 500 }}
                    className="text-9xl md:text-[14rem] font-black tabular-nums tracking-tighter italic italic leading-none"
                  >
                    {score.toLocaleString()}
                  </motion.p>
                </div>

                <div className="flex flex-col items-center gap-10">
                  <motion.div 
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="px-14 py-6 rounded-[3rem] bg-orange-500/10 border-[3px] border-orange-500/60 text-orange-500 font-black uppercase tracking-[0.5em] text-sm shadow-[0_0_80px_rgba(249,115,22,0.3)] backdrop-blur-3xl italic italic"
                  >
                    {GAME_MODES[activeSubMode].name}
                  </motion.div>
                  <div className="flex gap-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        initial={false}
                        animate={{ 
                          scaleY: i < (combo % 5) ? 2 : 1,
                          backgroundColor: i < (combo % 5) ? "#f97316" : "rgba(255,255,255,0.05)"
                        }}
                        className={cn("w-16 h-3 rounded-full transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)]")} 
                      />
                    ))}
                  </div>
                </div>

                <div className="text-right space-y-4">
                   <div className="flex items-center justify-end gap-4 text-orange-500">
                    <p className="text-xs font-black tracking-[0.6em] text-white/30 uppercase italic italic leading-none">Momentum</p>
                    <Zap className="w-6 h-6 fill-orange-500 drop-shadow-[0_0_15px_#f97316]" />
                  </div>
                  <motion.p
                    key={combo}
                    animate={{ scale: combo > 0 ? [1, 1.4, 1] : 1 }}
                    className={cn(
                      "text-8xl md:text-[12rem] font-black tabular-nums tracking-tighter italic italic transition-colors leading-none",
                      combo > 4 ? 'text-orange-500 drop-shadow-[0_0_50px_rgba(249,115,22,0.8)]' : 'text-white'
                    )}
                  >
                    {combo}<span className="text-[3rem] ml-4 text-white/20 not-italic font-black">X</span>
                  </motion.p>
                </div>
              </div>

              <div className="relative flex items-center justify-center flex-1 w-full perspective-3000 overflow-visible">
                <GameAvatar targetMove={targetMove} feedback={feedback} />

                <AnimatePresence mode="popLayout">
                  {feedback && (
                    <motion.div
                      key={`feedback-${feedback}`}
                      initial={{ scale: 0.2, opacity: 0, y: 500, rotateZ: -15 }}
                      animate={{ scale: 1, opacity: 1, y: 0, rotateZ: 0 }}
                      exit={{ opacity: 0, scale: 3, filter: 'blur(40px)' }}
                      transition={{ type: 'spring', bounce: 0.4, duration: 0.7 }}
                      className={cn(
                        "absolute z-30 text-[10rem] md:text-[18rem] font-black tracking-[calc(-0.05em)] uppercase italic italic px-40 py-24 rounded-[8rem] border-[24px] backdrop-blur-[120px] shadow-[0_0_200px_rgba(0,0,0,0.8)] pointer-events-none",
                        feedback === 'PERFECT' 
                          ? 'text-green-400 border-green-500/50 bg-green-500/20 shadow-green-500/40' 
                          : feedback === 'MISS'
                            ? 'text-red-500 border-red-500/50 bg-red-500/20 shadow-red-500/40'
                            : 'text-yellow-500 border-yellow-500/50 bg-yellow-500/20 shadow-yellow-500/40'
                      )}
                    >
                      {feedback}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pb-24 w-full flex justify-center">
                <button
                  onClick={stopWorkout}
                  className="group px-16 py-8 rounded-[3.5rem] bg-white/5 hover:bg-white/[0.08] font-black text-white/20 hover:text-white transition-all border-[3px] border-white/5 flex items-center gap-8 active:scale-90 shadow-4xl backdrop-blur-3xl"
                >
                  <RefreshCw className="w-8 h-8 group-hover:rotate-180 transition-transform duration-1000 ease-in-out text-orange-500" />
                  <span className="uppercase tracking-[0.8em] text-xs font-black italic italic leading-none">ABORT TRAINING PROTOCOL</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Panel Integration */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            config={config}
            setConfig={setConfig}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        
        :root {
          font-family: 'Outfit', sans-serif;
        }

        body {
          background-color: #020617;
          overflow: hidden;
        }

        .text-outline {
          -webkit-text-stroke: 2px rgba(249, 115, 22, 0.5);
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.4); border-radius: 10px; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .perspective-1000 { perspective: 1000px; }
        .perspective-2000 { perspective: 2000px; }
        .perspective-3000 { perspective: 3000px; }

        ::selection {
          background: rgba(249, 115, 22, 0.4);
          color: white;
        }

        .shadow-3xl {
            box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8);
        }
        .shadow-4xl {
            box-shadow: 0 60px 150px -30px rgba(0,0,0,0.9);
        }
      `}</style>
    </div>
  );
}
