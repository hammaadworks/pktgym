import { z } from 'zod';

/**
 * IMU Data schema for accelerometer and gyroscope sensors
 */
export const IMUDataSchema = z.object({
  accel: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  gyro: z.object({
    alpha: z.number(),
    beta: z.number(),
    gamma: z.number(),
  }),
  accelGrav: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional(),
  orientation: z.object({
    alpha: z.number(),
    beta: z.number(),
    gamma: z.number(),
  }).optional(),
  timestamp: z.number().optional(),
});

/**
 * PeerJS Message types and payloads
 */
export const PeerMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('motion-data'),
    data: IMUDataSchema,
  }),
  z.object({
    type: z.literal('menu-action'),
    data: z.any(), // Generic payload for menu commands
  }),
  z.object({
    type: z.literal('state-update'),
    data: z.any(), // Generic payload for syncing state back to mobile
  }),
]);

export type IMUData = z.infer<typeof IMUDataSchema>;
export type PeerMessage = z.infer<typeof PeerMessageSchema>;
