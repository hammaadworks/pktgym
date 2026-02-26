import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { GameMode, MoveType } from '../engine/types';

export type CameraConfig = {
  JUMP_Y_DELTA: number;
  DUCK_Y_DELTA: number;
  SQUAT_Y_DELTA: number;
  JAB_Z_DELTA: number;
  KNEE_Y_DELTA: number;
};

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  JUMP_Y_DELTA: -0.04,
  DUCK_Y_DELTA: 0.04,
  SQUAT_Y_DELTA: 0.04,
  JAB_Z_DELTA: 0.10,
  KNEE_Y_DELTA: -0.05,
};

export class CameraEngine {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitialized = false;
  public config: CameraConfig = { ...DEFAULT_CAMERA_CONFIG };

  async initialize() {
    if (this.isInitialized) return;
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
    );
    this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numPoses: 1
    });
    this.isInitialized = true;
  }

  getPeaks(results: PoseLandmarkerResult, previousResults: PoseLandmarkerResult | null) {
    if (!results.landmarks || results.landmarks.length === 0 || !previousResults?.landmarks || previousResults.landmarks.length === 0) {
      return null;
    }

    const landmarks = results.landmarks[0];
    const prevLandmarks = previousResults.landmarks[0];

    // Use shoulders (11, 12) for vertical tracking to allow user to be closer to camera!
    const currentShoulderY = (landmarks[11].y + landmarks[12].y) / 2;
    const prevShoulderY = (prevLandmarks[11].y + prevLandmarks[12].y) / 2;
    const shoulderDeltaY = currentShoulderY - prevShoulderY;

    // Use nose for dodge
    const noseX = landmarks[0].x;
    const prevNoseX = prevLandmarks[0].x;
    const noseDeltaX = noseX - prevNoseX;

    // Use wrists for punches
    const leftWristZ = landmarks[15].z;
    const rightWristZ = landmarks[16].z;
    const prevLeftWristZ = prevLandmarks[15].z;
    const prevRightWristZ = prevLandmarks[16].z;
    const leftPunchDeltaZ = prevLeftWristZ - leftWristZ;
    const rightPunchDeltaZ = prevRightWristZ - rightWristZ;
    
    // Knee vertical movement for kickboxing
    // If knees are cut off, this might fail, so we look at knee delta if available, 
    // or fallback to hip movement if we can.
    let kneeDeltaY = 0;
    if (landmarks[25] && landmarks[26]) {
       const currentKneeY = (landmarks[25].y + landmarks[26].y) / 2;
       const prevKneeY = (prevLandmarks[25].y + prevLandmarks[26].y) / 2;
       kneeDeltaY = currentKneeY - prevKneeY;
    }

    return {
      shoulderDeltaY,
      noseDeltaX,
      leftPunchDeltaZ,
      rightPunchDeltaZ,
      kneeDeltaY
    };
  }

  tuneConfig(move: MoveType, peaks: NonNullable<ReturnType<typeof this.getPeaks>>) {
    const factor = 0.6; // comfortable threshold
    switch (move) {
      case 'jump':
        if (peaks.shoulderDeltaY < -0.01) this.config.JUMP_Y_DELTA = peaks.shoulderDeltaY * factor;
        break;
      case 'duck':
        if (peaks.shoulderDeltaY > 0.01) this.config.DUCK_Y_DELTA = peaks.shoulderDeltaY * factor;
        break;
      case 'squat':
        if (peaks.shoulderDeltaY > 0.01) this.config.SQUAT_Y_DELTA = peaks.shoulderDeltaY * factor;
        break;
      case 'jab':
      case 'hook':
        const maxPunch = Math.max(peaks.leftPunchDeltaZ, peaks.rightPunchDeltaZ);
        if (maxPunch > 0.05) this.config.JAB_Z_DELTA = maxPunch * factor;
        break;
      case 'knee':
      case 'front_kick':
        if (peaks.kneeDeltaY < -0.01) this.config.KNEE_Y_DELTA = peaks.kneeDeltaY * factor;
        break;
    }
  }

  detectMove(
    mode: GameMode,
    results: PoseLandmarkerResult,
    previousResults: PoseLandmarkerResult | null
  ): MoveType {
    const peaks = this.getPeaks(results, previousResults);
    if (!peaks) return 'none';

    let detectedMove: MoveType = 'none';
    let triggerReason = '';

    const { shoulderDeltaY, noseDeltaX, leftPunchDeltaZ, rightPunchDeltaZ, kneeDeltaY } = peaks;

    switch (mode) {
      case 'shadow_boxing':
        if (leftPunchDeltaZ > this.config.JAB_Z_DELTA || rightPunchDeltaZ > this.config.JAB_Z_DELTA) {
           detectedMove = 'jab';
           triggerReason = `Punch Z Delta > ${this.config.JAB_Z_DELTA.toFixed(3)}`;
        } else if (noseDeltaX > 0.05) {
           detectedMove = 'slip';
        } else if (noseDeltaX < -0.05) {
           detectedMove = 'slip';
        }
        break;

      case 'reflex_ridge':
        if (shoulderDeltaY < this.config.JUMP_Y_DELTA) {
          detectedMove = 'jump';
          triggerReason = `Shoulder Y Delta ${shoulderDeltaY.toFixed(3)} < ${this.config.JUMP_Y_DELTA.toFixed(3)}`;
        } else if (shoulderDeltaY > this.config.DUCK_Y_DELTA) {
          detectedMove = 'duck';
          triggerReason = `Shoulder Y Delta ${shoulderDeltaY.toFixed(3)} > ${this.config.DUCK_Y_DELTA.toFixed(3)}`;
        } else if (noseDeltaX > 0.05) {
          detectedMove = 'dodge_right';
        } else if (noseDeltaX < -0.05) {
          detectedMove = 'dodge_left';
        }
        break;

      case 'cardio_core':
        if (shoulderDeltaY > this.config.SQUAT_Y_DELTA) {
          detectedMove = 'squat';
          triggerReason = `Shoulder Y Delta ${shoulderDeltaY.toFixed(3)} > ${this.config.SQUAT_Y_DELTA.toFixed(3)}`;
        }
        break;
        
      case 'kickboxing':
        if (kneeDeltaY < this.config.KNEE_Y_DELTA) {
           detectedMove = 'knee';
           triggerReason = `Knee Y Delta ${kneeDeltaY.toFixed(3)} < ${this.config.KNEE_Y_DELTA.toFixed(3)}`;
        }
        break;
    }

    if (detectedMove !== 'none') {
       console.log(`[CAMERA] Action Detected: [ ${detectedMove.toUpperCase()} ] | Trigger: ${triggerReason}`);
    }

    return detectedMove;
  }
}

export const cameraEngine = new CameraEngine();
