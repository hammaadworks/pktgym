/* eslint-disable */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MoveType } from '@/features/games/engine';
import { cn } from '@/lib/utils';

interface GameAvatarProps {
  targetMove: MoveType;
  feedback: 'PERFECT' | 'MISS' | 'LATE' | null;
}

export default function GameAvatar({ targetMove, feedback }: GameAvatarProps) {
  // Define animation states for different moves
  const getVariants = () => {
    const base = {
      head: { y: 0, scale: 1 },
      torso: { y: 0, rotate: 0 },
      leftArm: { rotateZ: 20, y: 0 },
      rightArm: { rotateZ: -20, y: 0 },
      leftLeg: { rotateZ: 10, y: 0 },
      rightLeg: { rotateZ: -10, y: 0 },
    };

    switch (targetMove) {
      case 'squat':
        return {
          head: { y: 40 },
          torso: { y: 40 },
          leftArm: { rotateZ: 90, y: 40 },
          rightArm: { rotateZ: -90, y: 40 },
          leftLeg: { rotateZ: -45, y: 0 },
          rightLeg: { rotateZ: 45, y: 0 },
        };
      case 'pushup':
        return {
          head: { y: 60, x: 20 },
          torso: { y: 50, rotateZ: 90 },
          leftArm: { rotateZ: 180, y: 50 },
          rightArm: { rotateZ: 180, y: 50 },
          leftLeg: { rotateZ: 90, y: 50 },
          rightLeg: { rotateZ: 90, y: 50 },
        };
      case 'run':
        return {
          head: { y: [0, -10, 0] },
          torso: { y: [0, -10, 0] },
          leftArm: { rotateZ: [45, -45, 45] },
          rightArm: { rotateZ: [-45, 45, -45] },
          leftLeg: { rotateZ: [-30, 30, -30] },
          rightLeg: { rotateZ: [30, -30, 30] },
        };
      case 'burpee':
        return {
          head: { y: [0, 80, -40, 0] },
          torso: { y: [0, 80, -40, 0] },
          leftArm: { rotateZ: [20, 180, 180, 20], y: [0, 80, -40, 0] },
          rightArm: { rotateZ: [-20, -180, -180, -20], y: [0, 80, -40, 0] },
          leftLeg: { rotateZ: [10, 90, 0, 10], y: [0, 80, 0, 0] },
          rightLeg: { rotateZ: [-10, 90, 0, -10], y: [0, 80, 0, 0] },
        };
      case 'arm_rotation':
        return {
          ...base,
          leftArm: { rotateZ: [0, 360], transition: { repeat: Infinity, duration: 1, ease: 'linear' } },
          rightArm: { rotateZ: [0, -360], transition: { repeat: Infinity, duration: 1, ease: 'linear' } },
        };
      case 'wrist_rotation':
        return {
          ...base,
          leftArm: { rotateZ: 90 },
          rightArm: { rotateZ: -90 },
        };
      case 'jab':
        return { ...base, rightArm: { rotateZ: -90, x: 30 } };
      case 'hook':
        return { ...base, leftArm: { rotateZ: 0, x: 20, y: -20 } };
      case 'front_kick':
        return { ...base, rightLeg: { rotateZ: -90, y: -20 } };
      case 'jump':
        return {
          head: { y: -60 }, torso: { y: -60 },
          leftArm: { rotateZ: 180, y: -60 }, rightArm: { rotateZ: -180, y: -60 },
          leftLeg: { y: -60 }, rightLeg: { y: -60 },
        };
      case 'duck':
        return {
          head: { y: 40 }, torso: { y: 40 },
          leftArm: { y: 40 }, rightArm: { y: 40 },
          leftLeg: { rotateZ: -45 }, rightLeg: { rotateZ: 45 },
        };
      case 'dodge_left':
        return {
          head: { x: -40 }, torso: { x: -40, rotateZ: -15 },
          leftArm: { x: -40 }, rightArm: { x: -40 },
          leftLeg: { x: -20 }, rightLeg: { x: -40 },
        };
      case 'dodge_right':
        return {
          head: { x: 40 }, torso: { x: 40, rotateZ: 15 },
          leftArm: { x: 40 }, rightArm: { x: 40 },
          leftLeg: { x: 40 }, rightLeg: { x: 20 },
        };
      default:
        return base;
    }
  };

  const variants = getVariants();

  // Highlight color based on feedback or neutral target state
  const colorClass = feedback === 'PERFECT' ? 'bg-green-500 shadow-[0_0_40px_#22c55e]' : 
                     feedback === 'MISS' ? 'bg-red-500 shadow-[0_0_40px_#ef4444]' : 
                     feedback === 'LATE' ? 'bg-yellow-500 shadow-[0_0_40px_#eab308]' : 
                     targetMove !== 'none' ? 'bg-orange-500 shadow-[0_0_40px_#f97316]' : 
                     'bg-white/20';

  const transitionSettings = targetMove === 'run' || targetMove === 'burpee' 
    ? { duration: 0.5, repeat: Infinity, repeatType: "reverse" } 
    : { type: 'spring', stiffness: 200, damping: 15 };

  return (
    <div className="relative w-[300px] h-[400px] flex items-center justify-center">
      {/* Target Move Label Overlay */}
      <AnimatePresence>
        {targetMove !== 'none' && !feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: -180 }}
            exit={{ opacity: 0, y: -200 }}
            className="absolute top-1/2 text-5xl font-black uppercase tracking-tighter text-white drop-shadow-[0_0_20px_#f97316] italic z-20"
          >
            {targetMove.replace('_', ' ')}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full h-full flex flex-col items-center z-10">
        {/* Head */}
        <motion.div
          animate={variants.head as any}
          transition={transitionSettings as any}
          className={cn("w-16 h-16 rounded-full absolute top-[60px] z-20 transition-colors duration-300", colorClass)}
        />
        
        {/* Torso */}
        <motion.div
          animate={variants.torso as any}
          transition={transitionSettings as any}
          className={cn("w-6 h-32 rounded-full absolute top-[130px] z-10 transition-colors duration-300", colorClass)}
        />

        {/* Left Arm */}
        <motion.div
          animate={variants.leftArm as any}
          style={{ originY: 0 }}
          transition={transitionSettings as any}
          className={cn("w-4 h-24 rounded-full absolute top-[140px] left-[110px] z-0 transition-colors duration-300", colorClass)}
        />

        {/* Right Arm */}
        <motion.div
          animate={variants.rightArm as any}
          style={{ originY: 0 }}
          transition={transitionSettings as any}
          className={cn("w-4 h-24 rounded-full absolute top-[140px] right-[110px] z-0 transition-colors duration-300", colorClass)}
        />

        {/* Left Leg */}
        <motion.div
          animate={variants.leftLeg as any}
          style={{ originY: 0 }}
          transition={transitionSettings as any}
          className={cn("w-5 h-32 rounded-full absolute top-[250px] left-[130px] z-0 transition-colors duration-300", colorClass)}
        />

        {/* Right Leg */}
        <motion.div
          animate={variants.rightLeg as any}
          style={{ originY: 0 }}
          transition={transitionSettings as any}
          className={cn("w-5 h-32 rounded-full absolute top-[250px] right-[130px] z-0 transition-colors duration-300", colorClass)}
        />
      </div>
    </div>
  );
}
