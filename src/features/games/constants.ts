import { Flame, Target, ShieldAlert, Activity, Dumbbell, HeartPulse, Zap } from 'lucide-react';
import { GameMode } from './engine/types';

export type ExtendedMode = GameMode | 'power_workout';

export const EXTENDED_MODES: Record<ExtendedMode, { name: string; description: string; icon: any; colorClass: string }> = {
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
