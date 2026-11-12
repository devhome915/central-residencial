import { database } from '../../database/database.js';
import type { HomeEvent } from '../../domain/event.js';
import type { EventRepositoryPort } from '../../ports/event-repository.port.js';

export class SqliteEventRepository implements EventRepositoryPort {
  listRecent(): HomeEvent[] {
    const rows = database
      .prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT 50')
      .all() as unknown as HomeEvent[];

    return rows;
  }

  findLatestForDevice(deviceId: string, deviceName: string): HomeEvent | null {
    const row = database
      .prepare(`
        SELECT * FROM events
        WHERE device_id = ? OR (device_id IS NULL AND device = ?)
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .get(deviceId, deviceName) as HomeEvent | undefined;

    return row ?? null;
  }

  save(event: HomeEvent): void {
    database
      .prepare('INSERT INTO events (id, device, type, created_at, device_id, source) VALUES (?, ?, ?, ?, ?, ?)')
      .run(event.id, event.device, event.type, event.created_at, event.device_id ?? null, event.source ?? 'simulated');
  }

  delete(id: string): boolean {
    const result = database.prepare('DELETE FROM events WHERE id = ?').run(id);
    return (result.changes ?? 0) > 0;
  }
}
