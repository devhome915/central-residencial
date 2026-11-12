import { randomUUID } from 'node:crypto';

export const validEventTypes = ['door_open', 'door_closed', 'motion'] as const;

export type EventType = (typeof validEventTypes)[number];
export type EventSource = 'simulated' | 'device';

export interface HomeEvent {
  id: string;
  device: string;
  device_id?: string | null;
  type: EventType;
  source?: EventSource;
  created_at: string;
}

export function isValidEventType(value: unknown): value is EventType {
  return typeof value === 'string' && validEventTypes.includes(value as EventType);
}

export function isValidEventSource(value: unknown): value is EventSource {
  return value === 'simulated' || value === 'device';
}

export function normalizeDeviceName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 80 ? normalized : null;
}

export function createEvent(
  device: string,
  type: EventType,
  deviceId: string | null = null,
  source: EventSource = 'simulated',
): HomeEvent {
  return {
    id: randomUUID(),
    device,
    device_id: deviceId,
    type,
    source,
    created_at: new Date().toISOString(),
  };
}
