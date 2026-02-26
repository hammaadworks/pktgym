import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { cameraEngine } from './CameraEngine';
import { GameMode, MoveType } from '../engine/types';

interface CameraViewProps {
  activeMode?: GameMode;
  onMoveDetected?: (move: MoveType) => void;
  onPeaksDetected?: (peaks: ReturnType<typeof cameraEngine.getPeaks>) => void;
  isActive: boolean;
}

export default function CameraView({ activeMode, onMoveDetected, onPeaksDetected, isActive }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const previousResultRef = useRef<PoseLandmarkerResult | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActiveState = true;

    async function setupCamera() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });

        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 } 
        });
        
        if (videoRef.current && isActiveState) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play();
             setIsReady(true);
             predictWebcam();
          };
        }
      } catch (err) {
        console.error("Camera setup failed:", err);
      }
    }

    if (isActive) {
      setupCamera();
    }

    return () => {
      isActiveState = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, [isActive]);

  const predictWebcam = () => {
    if (!videoRef.current || !poseLandmarkerRef.current || !isActive) return;
    
    const startTimeMs = performance.now();
    if (lastDetectionTimeRef.current !== videoRef.current.currentTime) {
      lastDetectionTimeRef.current = videoRef.current.currentTime;
      const results = poseLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
      
      // Draw landmarks
      if (canvasRef.current) {
         const ctx = canvasRef.current.getContext('2d');
         if (ctx) {
           ctx.save();
           ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
           // Mirror the canvas
           ctx.translate(canvasRef.current.width, 0);
           ctx.scale(-1, 1);

           if (results.landmarks && results.landmarks.length > 0) {
             for (const landmark of results.landmarks[0]) {
                ctx.beginPath();
                ctx.arc(landmark.x * canvasRef.current.width, landmark.y * canvasRef.current.height, 4, 0, 2 * Math.PI);
                ctx.fillStyle = '#f97316';
                ctx.fill();
             }
           }
           ctx.restore();
         }
      }

      const peaks = cameraEngine.getPeaks(results, previousResultRef.current);
      if (peaks && onPeaksDetected) {
        onPeaksDetected(peaks);
      }

      if (activeMode && onMoveDetected) {
        const move = cameraEngine.detectMove(activeMode, results, previousResultRef.current);
        if (move !== 'none') {
           onMoveDetected(move);
        }
      }
      previousResultRef.current = results;
    }
    
    rafIdRef.current = requestAnimationFrame(predictWebcam);
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden opacity-30 pointer-events-none">
      {!isReady && <div className="absolute z-10 text-blue-400 font-bold uppercase tracking-widest animate-pulse text-2xl">Initializing Camera AI...</div>}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]" />
    </div>
  );
}
