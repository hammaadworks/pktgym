import { detectMove } from '../lib/motionEngine';

describe('Motion Engine', () => {
  it('detects a Jab from high forward acceleration', () => {
    // Simulating phone in right hand, punching forward (Z axis spike)
    const stream = [
      { accel: { x: 0, y: 0, z: 0 }, gyro: { alpha: 0, beta: 0, gamma: 0 } },
      { accel: { x: 0, y: 0, z: 15 }, gyro: { alpha: 0, beta: 0, gamma: 0 } }, // Spike
      { accel: { x: 0, y: 0, z: -5 }, gyro: { alpha: 0, beta: 0, gamma: 0 } },
    ];
    
    const result = detectMove('shadow_boxing', stream);
    expect(result).toBe('jab');
  });

  it('detects a Hook from high rotational velocity', () => {
    // Simulating twisting arm horizontally
    const stream = [
      { accel: { x: 0, y: 0, z: 0 }, gyro: { alpha: 0, beta: 0, gamma: 0 } },
      { accel: { x: 0, y: 0, z: 5 }, gyro: { alpha: 0, beta: 150, gamma: 0 } }, // High rotation
      { accel: { x: 0, y: 0, z: 0 }, gyro: { alpha: 0, beta: -20, gamma: 0 } },
    ];
    
    const result = detectMove('shadow_boxing', stream);
    expect(result).toBe('hook');
  });

  it('detects a Jump from high vertical acceleration', () => {
    const stream = [
      { accel: { x: 0, y: 0, z: 0 }, gyro: { alpha: 0, beta: 0, gamma: 0 } },
      { accel: { x: 0, y: 15, z: 0 }, gyro: { alpha: 0, beta: 0, gamma: 0 } }, // Upward spike
    ];
    
    const result = detectMove('reflex_ridge', stream);
    expect(result).toBe('jump');
  });
});
