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