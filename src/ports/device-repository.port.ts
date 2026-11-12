import type { HomeDevice } from '../domain/device.js';

export interface DeviceRepositoryPort {
  list(): HomeDevice[];
  findById(id: string): HomeDevice | null;
  markSeen(id: string, seenAt: string): boolean;
  save(device: HomeDevice): void;
  delete(id: string): boolean;
}
