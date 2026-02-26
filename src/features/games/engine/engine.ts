import { IMUData, MoveType, GameMode } from './types';
import { GameConfig } from './config';
import { DEFAULT_CONFIG } from './config';

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

  let detectedMove: MoveType = 'none';
  let triggerReason = '';

  switch (mode) {
    case 'shadow_boxing':
      if (maxBeta > config.HOOK_GYRO_THRESHOLD) {
        detectedMove = 'hook';
        triggerReason = `maxBeta (${maxBeta.toFixed(2)}) > HOOK_GYRO_THRESHOLD (${config.HOOK_GYRO_THRESHOLD.toFixed(2)})`;
      } else if (Math.abs(maxZ) > config.JAB_ACCEL_THRESHOLD || Math.abs(minZ) > config.JAB_ACCEL_THRESHOLD) {
        detectedMove = 'jab';
        triggerReason = `Math.abs(maxZ|minZ) (${Math.max(Math.abs(maxZ), Math.abs(minZ)).toFixed(2)}) > JAB_ACCEL_THRESHOLD (${config.JAB_ACCEL_THRESHOLD.toFixed(2)})`;
      } else if (Math.abs(maxX) > config.SLIP_ACCEL_THRESHOLD || Math.abs(minX) > config.SLIP_ACCEL_THRESHOLD) {
        detectedMove = 'slip';
        triggerReason = `Math.abs(maxX|minX) (${Math.max(Math.abs(maxX), Math.abs(minX)).toFixed(2)}) > SLIP_ACCEL_THRESHOLD (${config.SLIP_ACCEL_THRESHOLD.toFixed(2)})`;
      }
      break;

    case 'kickboxing':
      if (maxY > config.KNEE_ACCEL_THRESHOLD) {
        detectedMove = 'knee';
        triggerReason = `maxY (${maxY.toFixed(2)}) > KNEE_ACCEL_THRESHOLD (${config.KNEE_ACCEL_THRESHOLD.toFixed(2)})`;
      } else if (minY < config.SPRAWL_ACCEL_THRESHOLD) {
        detectedMove = 'sprawl';
        triggerReason = `minY (${minY.toFixed(2)}) < SPRAWL_ACCEL_THRESHOLD (${config.SPRAWL_ACCEL_THRESHOLD.toFixed(2)})`;
      } else if (maxAlpha > config.FRONT_KICK_GYRO_THRESHOLD) {
        detectedMove = 'front_kick';
        triggerReason = `maxAlpha (${maxAlpha.toFixed(2)}) > FRONT_KICK_GYRO_THRESHOLD (${config.FRONT_KICK_GYRO_THRESHOLD.toFixed(2)})`;
      }
      break;

    case 'reflex_ridge':
      if (maxY > config.JUMP_ACCEL_THRESHOLD) {
        detectedMove = 'jump';
        triggerReason = `maxY (${maxY.toFixed(2)}) > JUMP_ACCEL_THRESHOLD (${config.JUMP_ACCEL_THRESHOLD.toFixed(2)})`;
      } else if (minY < config.DUCK_ACCEL_THRESHOLD) {
        detectedMove = 'duck';
        triggerReason = `minY (${minY.toFixed(2)}) < DUCK_ACCEL_THRESHOLD (${config.DUCK_ACCEL_THRESHOLD.toFixed(2)})`;
      } else if (maxX > config.DODGE_ACCEL_THRESHOLD) {
        detectedMove = 'dodge_right';
        triggerReason = `maxX (${maxX.toFixed(2)}) > DODGE_ACCEL_THRESHOLD (${config.DODGE_ACCEL_THRESHOLD.toFixed(2)})`;
      } else if (minX < -config.DODGE_ACCEL_THRESHOLD) {
        detectedMove = 'dodge_left';
        triggerReason = `minX (${minX.toFixed(2)}) < -DODGE_ACCEL_THRESHOLD (${(-config.DODGE_ACCEL_THRESHOLD).toFixed(2)})`;
      }
      break;

    case 'iron_pump':
      if (maxY > config.PRESS_ARC_THRESHOLD) {
        detectedMove = 'press';
        triggerReason = `maxY (${maxY.toFixed(2)}) > PRESS_ARC_THRESHOLD (${config.PRESS_ARC_THRESHOLD.toFixed(2)})`;
      } else if (maxY > config.CURL_ARC_THRESHOLD) {
        detectedMove = 'curl';
        triggerReason = `maxY (${maxY.toFixed(2)}) > CURL_ARC_THRESHOLD (${config.CURL_ARC_THRESHOLD.toFixed(2)})`;
      }
      break;

    case 'cardio_core':
      if (maxY > config.BURPEE_ACCEL_THRESHOLD && Math.abs(minY) > config.BURPEE_ACCEL_THRESHOLD / 2) {
        detectedMove = 'burpee';
        triggerReason = `maxY (${maxY.toFixed(2)}) > BURPEE_ACCEL_THRESHOLD (${config.BURPEE_ACCEL_THRESHOLD.toFixed(2)}) && Math.abs(minY) > BURPEE_ACCEL_THRESHOLD / 2`;
      } else if (maxY > config.RUN_ACCEL_THRESHOLD) {
        detectedMove = 'run';
        triggerReason = `maxY (${maxY.toFixed(2)}) > RUN_ACCEL_THRESHOLD (${config.RUN_ACCEL_THRESHOLD.toFixed(2)})`;
      } else if (minY < -config.SQUAT_ACCEL_THRESHOLD) {
        detectedMove = 'squat';
        triggerReason = `minY (${minY.toFixed(2)}) < -SQUAT_ACCEL_THRESHOLD (${(-config.SQUAT_ACCEL_THRESHOLD).toFixed(2)})`;
      } else if (Math.abs(maxZ) > config.PUSHUP_ACCEL_THRESHOLD) {
        detectedMove = 'pushup';
        triggerReason = `Math.abs(maxZ) (${Math.abs(maxZ).toFixed(2)}) > PUSHUP_ACCEL_THRESHOLD (${config.PUSHUP_ACCEL_THRESHOLD.toFixed(2)})`;
      }
      break;

    case 'warmup_core':
      if (maxBeta > config.ARM_ROTATION_GYRO_THRESHOLD || maxAlpha > config.ARM_ROTATION_GYRO_THRESHOLD) {
        detectedMove = 'arm_rotation';
        triggerReason = `maxBeta (${maxBeta.toFixed(2)}) or maxAlpha (${maxAlpha.toFixed(2)}) > ARM_ROTATION_GYRO_THRESHOLD (${config.ARM_ROTATION_GYRO_THRESHOLD.toFixed(2)})`;
      } else if (maxGamma > config.WRIST_ROTATION_GYRO_THRESHOLD) {
        detectedMove = 'wrist_rotation';
        triggerReason = `maxGamma (${maxGamma.toFixed(2)}) > WRIST_ROTATION_GYRO_THRESHOLD (${config.WRIST_ROTATION_GYRO_THRESHOLD.toFixed(2)})`;
      }
      break;
  }

  if (detectedMove !== 'none') {
    console.log(
      `\n================= ACTION DETECTED =================\n` +
      `  Action:       [ ${detectedMove.toUpperCase()} ]\n` +
      `  Game Mode:    ${mode}\n` +
      `  Trigger:      ${triggerReason}\n` +
      `---------------------------------------------------\n` +
      `  IMU Peaks:\n` +
      `    Accel X:    max: ${maxX.toFixed(2).padStart(6)}, min: ${minX.toFixed(2).padStart(6)}\n` +
      `    Accel Y:    max: ${maxY.toFixed(2).padStart(6)}, min: ${minY.toFixed(2).padStart(6)}\n` +
      `    Accel Z:    max: ${maxZ.toFixed(2).padStart(6)}, min: ${minZ.toFixed(2).padStart(6)}\n` +
      `    Gyro:       alpha: ${maxAlpha.toFixed(2).padStart(6)}, beta: ${maxBeta.toFixed(2).padStart(6)}, gamma: ${maxGamma.toFixed(2).padStart(6)}\n` +
      `===================================================\n`
    );
  }

  return detectedMove;
}
