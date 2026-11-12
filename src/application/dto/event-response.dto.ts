import type { EventSource, EventType } from '../../domain/event.js';

export interface EventResponseDto {
  id: string;
  device: string;
  device_id?: string | null;
  type: EventType;
  source?: EventSource;
  created_at: string;
}
