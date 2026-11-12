import type { HomeEvent } from '../domain/event.js';

export interface EventRepositoryPort {
  listRecent(): HomeEvent[];
  findLatestForDevice(deviceId: string, deviceName: string): HomeEvent | null;
  save(event: HomeEvent): void;
  delete(id: string): boolean;
}
