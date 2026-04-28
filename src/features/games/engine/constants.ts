import { GameMode, MoveType } from './types';

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
