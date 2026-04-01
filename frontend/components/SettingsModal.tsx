'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GameConfig } from '../lib/config';
import { Settings2, X, ChevronRight, Sliders, Layout, Target, Activity, Dumbbell, Zap } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  config: GameConfig;
  setConfig: (config: GameConfig) => void;
  onClose: () => void;
}

type Tab = 'Global' | 'Boxing' | 'Kickboxing' | 'Reflex' | 'Iron Pump';

const TAB_DATA: Record<Tab, { icon: any, description: string }> = {
  'Global': { icon: Layout, description: 'Core game behavior and timings.' },
  'Boxing': { icon: Target, description: 'Sensitivity for shadow boxing moves.' },
  'Kickboxing': { icon: Zap, description: 'Pocket-based kick & knee detection.' },
  'Reflex': { icon: Activity, description: 'Obstacle dodge & jump physics.' },
  'Iron Pump': { icon: Dumbbell, description: 'Weight lifting motion arcs.' },
};

export default function SettingsModal({ config, setConfig, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Global');

  const handleChange = (key: keyof GameConfig, value: number) => {
    setConfig({ ...config, [key]: value });
  };

  const tabs: Tab[] = ['Global', 'Boxing', 'Kickboxing', 'Reflex', 'Iron Pump'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end md:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ x: '100%', opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] bg-[#0f172a] md:rounded-[2.5rem] border-l md:border border-white/10 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Settings2 className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">SYSTEM CALIBRATION</h2>
              <p className="text-sm text-white/40 font-medium uppercase tracking-widest">Tweak the physics engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-white/40 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Sidebar */}
          <nav className="w-full md:w-56 p-4 border-b md:border-b-0 md:border-r border-white/5 bg-black/20 shrink-0 overflow-x-auto no-scrollbar md:overflow-y-auto">
            <div className="flex md:flex-col gap-2">
              {tabs.map((tab) => {
                const Icon = TAB_DATA[tab].icon;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all relative shrink-0",
                      isActive 
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-bold text-sm">{tab}</span>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="hidden md:block absolute right-2 w-1 h-4 bg-white/30 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-md mx-auto space-y-10">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-orange-500" />
                  {activeTab} Parameters
                </h3>
                <p className="text-sm text-white/40">{TAB_DATA[activeTab].description}</p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8 pb-10"
                >
                  {activeTab === 'Global' && (
                    <>
                      <ParameterSlider
                        label="Listening Window"
                        unit="ms"
                        value={config.LISTENING_WINDOW_MS}
                        min={500} max={3000} step={100}
                        onChange={(v) => handleChange('LISTENING_WINDOW_MS', v)}
                      />
                      <ParameterSlider
                        label="Move Interval"
                        unit="ms"
                        value={config.MOVE_INTERVAL_MS}
                        min={200} max={3000} step={100}
                        onChange={(v) => handleChange('MOVE_INTERVAL_MS', v)}
                      />
                    </>
                  )}

                  {activeTab === 'Boxing' && (
                    <>
                      <ParameterSlider
                        label="Jab Acceleration"
                        unit="m/s²"
                        value={config.JAB_ACCEL_THRESHOLD}
                        min={5} max={30} step={1}
                        onChange={(v) => handleChange('JAB_ACCEL_THRESHOLD', v)}
                      />
                      <ParameterSlider
                        label="Hook Rotation"
                        unit="deg/s"
                        value={config.HOOK_GYRO_THRESHOLD}
                        min={30} max={200} step={5}
                        onChange={(v) => handleChange('HOOK_GYRO_THRESHOLD', v)}
                      />
                      <ParameterSlider
                        label="Slip Lateral"
                        unit="m/s²"
                        value={config.SLIP_ACCEL_THRESHOLD}
                        min={3} max={20} step={1}
                        onChange={(v) => handleChange('SLIP_ACCEL_THRESHOLD', v)}
                      />
                    </>
                  )}

                  {activeTab === 'Kickboxing' && (
                    <>
                      <ParameterSlider
                        label="Knee Vertical"
                        unit="m/s²"
                        value={config.KNEE_ACCEL_THRESHOLD}
                        min={5} max={30} step={1}
                        onChange={(v) => handleChange('KNEE_ACCEL_THRESHOLD', v)}
                      />
                      <ParameterSlider
                        label="Sprawl Drop"
                        unit="m/s²"
                        value={config.SPRAWL_ACCEL_THRESHOLD}
                        min={-30} max={-5} step={1}
                        onChange={(v) => handleChange('SPRAWL_ACCEL_THRESHOLD', v)}
                      />
                      <ParameterSlider
                        label="Kick Rotation"
                        unit="deg/s"
                        value={config.FRONT_KICK_GYRO_THRESHOLD}
                        min={50} max={300} step={10}
                        onChange={(v) => handleChange('FRONT_KICK_GYRO_THRESHOLD', v)}
                      />
                    </>
                  )}

                  {activeTab === 'Reflex' && (
                    <>
                      <ParameterSlider
                        label="Jump Intensity"
                        unit="m/s²"
                        value={config.JUMP_ACCEL_THRESHOLD}
                        min={5} max={30} step={1}
                        onChange={(v) => handleChange('JUMP_ACCEL_THRESHOLD', v)}
                      />
                      <ParameterSlider
                        label="Duck Depth"
                        unit="m/s²"
                        value={config.DUCK_ACCEL_THRESHOLD}
                        min={-30} max={-5} step={1}
                        onChange={(v) => handleChange('DUCK_ACCEL_THRESHOLD', v)}
                      />
                      <ParameterSlider
                        label="Dodge Force"
                        unit="m/s²"
                        value={config.DODGE_ACCEL_THRESHOLD}
                        min={3} max={20} step={1}
                        onChange={(v) => handleChange('DODGE_ACCEL_THRESHOLD', v)}
                      />
                    </>
                  )}

                  {activeTab === 'Iron Pump' && (
                    <>
                      <ParameterSlider
                        label="Curl Sensitivity"
                        unit="mag"
                        value={config.CURL_ARC_THRESHOLD}
                        min={2} max={15} step={1}
                        onChange={(v) => handleChange('CURL_ARC_THRESHOLD', v)}
                      />
                      <ParameterSlider
                        label="Press Sensitivity"
                        unit="mag"
                        value={config.PRESS_ARC_THRESHOLD}
                        min={2} max={20} step={1}
                        onChange={(v) => handleChange('PRESS_ARC_THRESHOLD', v)}
                      />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-black/20 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/5"
          >
            Apply & Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ParameterSlider({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="space-y-4 group">
      <div className="flex justify-between items-end">
        <label className="text-sm font-black text-white/60 uppercase tracking-widest group-hover:text-orange-500 transition-colors">
          {label}
        </label>
        <div className="text-right">
          <span className="text-2xl font-black text-white tabular-nums">{value}</span>
          <span className="ml-1 text-xs font-bold text-white/30 uppercase">{unit}</span>
        </div>
      </div>
      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-orange-500 focus:outline-none"
        />
        {/* Custom Track Background for more pop */}
        <div 
          className="absolute left-0 h-2 bg-orange-500/20 rounded-full pointer-events-none"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
    </div>
  );
}
