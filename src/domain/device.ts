import { randomUUID } from 'node:crypto';

export const validDeviceKinds = ['door', 'sensor', 'outlet'] as const;

export type DeviceKind = (typeof validDeviceKinds)[number];
export type DeviceState = 'open' | 'closed' | 'motion_detected' | 'unknown';
export type DeviceConnectionStatus = 'online' | 'offline' | 'unknown';

export interface HomeDevice {
  id: string;
  name: string;
  kind: DeviceKind;
  created_at: string;
  state: DeviceState;
  connection_status: DeviceConnectionStatus;
  last_seen_at: string | null;
  last_event_type: string | null;
}

export function isValidDeviceKind(value: unknown): value is DeviceKind {
  return typeof value === 'string' && validDeviceKinds.includes(value as DeviceKind);
}

export function normalizeDeviceName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 80 ? normalized : null;
}

export function createDevice(name: string, kind: DeviceKind): HomeDevice {
  return {
    id: randomUUID(),
    name,
    kind,
    created_at: new Date().toISOString(),
    state: 'unknown',
    connection_status: 'unknown',
    last_seen_at: null,
    last_event_type: null,
  };
}
