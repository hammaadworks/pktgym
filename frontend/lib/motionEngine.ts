import { GameConfig, DEFAULT_CONFIG } from './config';

export type IMUData = {
  accel: { x: number; y: number; z: number };
  gyro: { alpha: number; beta: number; gamma: number };
  accelGrav?: { x: number; y: number; z: number };
  orientation?: { alpha: number; beta: number; gamma: number };
  timestamp?: number;
};

export type MoveType = 
  | 'jab' | 'hook' | 'slip' // Shadow Boxing
  | 'front_kick' | 'knee' | 'sprawl' // Kickboxing
  | 'jump' | 'duck' | 'dodge_left' | 'dodge_right' // Reflex Ridge
  | 'curl' | 'press' // Iron Pump
  | 'squat' | 'pushup' | 'run' | 'burpee' // Cardio Core
  | 'arm_rotation' | 'wrist_rotation' // Warmup Core
  | 'none';

export type GameMode = 'shadow_boxing' | 'kickboxing' | 'reflex_ridge' | 'iron_pump' | 'cardio_core' | 'warmup_core';

export function getPeakValues(streamWindow: IMUData[]) {
  let maxZ = 0, minZ = 0;
  let maxY = 0, minY = 0;
  let maxX = 0, minX = 0;
  
  let maxAlpha = 0;
  let maxBeta = 0;
  let maxGamma = 0;

  streamWindow.forEach(frame => {
    if (frame.accel.z > maxZ) maxZ = frame.accel.z;
    if (frame.accel.z < minZ) minZ = frame.accel.z;
    
    if (frame.accel.y > maxY) maxY = frame.accel.y;
    if (frame.accel.y < minY) minY = frame.accel.y;
    
    if (frame.accel.x > maxX) maxX = frame.accel.x;
    if (frame.accel.x < minX) minX = frame.accel.x;
    
    const absAlpha = Math.abs(frame.gyro.alpha);
    const absBeta = Math.abs(frame.gyro.beta);
    const absGamma = Math.abs(frame.gyro.gamma);

    if (absAlpha > maxAlpha) maxAlpha = absAlpha;
    if (absBeta > maxBeta) maxBeta = absBeta;
    if (absGamma > maxGamma) maxGamma = absGamma;
  });

  return { maxZ, minZ, maxY, minY, maxX, minX, maxAlpha, maxBeta, maxGamma };
}

export function tuneConfigWithCalibration(
  currentConfig: GameConfig, 
  move: MoveType, 
  peaks: ReturnType<typeof getPeakValues>
): GameConfig {
  const newConfig = { ...currentConfig };
  // Multiply the peak by 0.6 to get a comfortable threshold (60% of their max effort)
  const factor = 0.6;

  switch (move) {
    case 'jab':
      newConfig.JAB_ACCEL_THRESHOLD = Math.max(Math.abs(peaks.maxZ), Math.abs(peaks.minZ)) * factor;
      break;
    case 'hook':
      newConfig.HOOK_GYRO_THRESHOLD = peaks.maxBeta * factor;
      break;
    case 'slip':
      newConfig.SLIP_ACCEL_THRESHOLD = Math.max(Math.abs(peaks.maxX), Math.abs(peaks.minX)) * factor;
      break;
    case 'front_kick':
      newConfig.FRONT_KICK_GYRO_THRESHOLD = peaks.maxAlpha * factor;
      break;
    case 'knee':
      newConfig.KNEE_ACCEL_THRESHOLD = peaks.maxY * factor;
      break;
    case 'sprawl':
      newConfig.SPRAWL_ACCEL_THRESHOLD = peaks.minY * factor; // Keep negative
      break;
    case 'jump':
      newConfig.JUMP_ACCEL_THRESHOLD = peaks.maxY * factor;
      break;
    case 'duck':
      newConfig.DUCK_ACCEL_THRESHOLD = peaks.minY * factor;
      break;
    case 'dodge_left':
    case 'dodge_right':
      newConfig.DODGE_ACCEL_THRESHOLD = Math.max(Math.abs(peaks.maxX), Math.abs(peaks.minX)) * factor;
      break;
    case 'curl':
      newConfig.CURL_ARC_THRESHOLD = peaks.maxY * factor;
      break;
    case 'press':
      newConfig.PRESS_ARC_THRESHOLD = peaks.maxY * factor;
      break;
    case 'squat':
      newConfig.SQUAT_ACCEL_THRESHOLD = Math.abs(peaks.minY) * factor;
      break;
    case 'pushup':
      newConfig.PUSHUP_ACCEL_THRESHOLD = Math.max(Math.abs(peaks.maxZ), Math.abs(peaks.minZ)) * factor;
      break;
    case 'run':
      newConfig.RUN_ACCEL_THRESHOLD = peaks.maxY * factor;
      break;
    case 'burpee':
      newConfig.BURPEE_ACCEL_THRESHOLD = peaks.maxY * factor;
      break;
    case 'arm_rotation':
      newConfig.ARM_ROTATION_GYRO_THRESHOLD = Math.max(peaks.maxAlpha, peaks.maxBeta) * factor;
      break;
    case 'wrist_rotation':
      newConfig.WRIST_ROTATION_GYRO_THRESHOLD = peaks.maxGamma * factor;
      break;
  }

  // Set safety minimums
  for (const key in newConfig) {
     if (key.includes('THRESHOLD')) {
         if (key.includes('GYRO') && newConfig[key as keyof GameConfig] < 30) newConfig[key as keyof GameConfig] = 30;
         if (key.includes('ACCEL') && Math.abs(newConfig[key as keyof GameConfig]) < 3) {
            newConfig[key as keyof GameConfig] = newConfig[key as keyof GameConfig] < 0 ? -3 : 3;
         }
     }
  }

  return newConfig;
}

export function detectMove(
  mode: GameMode,
  streamWindow: IMUData[],
  config: GameConfig = DEFAULT_CONFIG
): MoveType {
  if (streamWindow.length < 5) return 'none'; // Need a minimum amount of data

  const peaks = getPeakValues(streamWindow);
  const { maxZ, minZ, maxY, minY, maxX, minX, maxAlpha, maxBeta, maxGamma } = peaks;

  switch (mode) {
    case 'shadow_boxing':
      if (maxBeta > config.HOOK_GYRO_THRESHOLD) return 'hook';
      if (Math.abs(maxZ) > config.JAB_ACCEL_THRESHOLD || Math.abs(minZ) > config.JAB_ACCEL_THRESHOLD) return 'jab';
      if (Math.abs(maxX) > config.SLIP_ACCEL_THRESHOLD || Math.abs(minX) > config.SLIP_ACCEL_THRESHOLD) return 'slip';
      return 'none';

    case 'kickboxing':
      if (maxY > config.KNEE_ACCEL_THRESHOLD) return 'knee';
      if (minY < config.SPRAWL_ACCEL_THRESHOLD) return 'sprawl';
      if (maxAlpha > config.FRONT_KICK_GYRO_THRESHOLD) return 'front_kick';
      return 'none';

    case 'reflex_ridge':
      if (maxY > config.JUMP_ACCEL_THRESHOLD) return 'jump';
      if (minY < config.DUCK_ACCEL_THRESHOLD) return 'duck';
      if (maxX > config.DODGE_ACCEL_THRESHOLD) return 'dodge_right';
      if (minX < -config.DODGE_ACCEL_THRESHOLD) return 'dodge_left';
      return 'none';

    case 'iron_pump':
      if (maxY > config.PRESS_ARC_THRESHOLD) return 'press';
      if (maxY > config.CURL_ARC_THRESHOLD) return 'curl';
      return 'none';

    case 'cardio_core':
      // Using arbitrary logic mapping for simplicity:
      // High total acceleration spikes = burpee
      // Consistent rhythmic Y = run
      // Deep min Y = squat
      // Low X/Y but high Z push = pushup
      if (maxY > config.BURPEE_ACCEL_THRESHOLD && Math.abs(minY) > config.BURPEE_ACCEL_THRESHOLD / 2) return 'burpee';
      if (maxY > config.RUN_ACCEL_THRESHOLD) return 'run';
      if (minY < -config.SQUAT_ACCEL_THRESHOLD) return 'squat';
      if (Math.abs(maxZ) > config.PUSHUP_ACCEL_THRESHOLD) return 'pushup';
      return 'none';

    case 'warmup_core':
      if (maxBeta > config.ARM_ROTATION_GYRO_THRESHOLD || maxAlpha > config.ARM_ROTATION_GYRO_THRESHOLD) return 'arm_rotation';
      if (maxGamma > config.WRIST_ROTATION_GYRO_THRESHOLD) return 'wrist_rotation';
      return 'none';

    default:
      return 'none';
  }
}

export const GAME_MODES: Record<GameMode, { name: string; moves: MoveType[]; placement: string }> = {
  shadow_boxing: {
    name: 'Shadow Boxing',
    moves: ['jab', 'hook', 'slip'],
    placement: 'Strap phone to forearm or hold tight'
  },
  kickboxing: {
    name: 'Kickboxing',
    moves: ['front_kick', 'knee', 'sprawl'],
    placement: 'Place phone in your front pocket'
  },
  reflex_ridge: {
    name: 'Reflex Ridge',
    moves: ['jump', 'duck', 'dodge_left', 'dodge_right'],
    placement: 'Place phone in your pocket'
  },
  iron_pump: {
    name: 'Iron Pump',
    moves: ['curl', 'press'],
    placement: 'Hold phone firmly in hand'
  },
  cardio_core: {
    name: 'Cardio Core',
    moves: ['squat', 'pushup', 'run', 'burpee'],
    placement: 'Place phone in your pocket or armband'
  },
  warmup_core: {
    name: 'Warmup Core',
    moves: ['arm_rotation', 'wrist_rotation'],
    placement: 'Hold phone firmly in hand'
  }
};
