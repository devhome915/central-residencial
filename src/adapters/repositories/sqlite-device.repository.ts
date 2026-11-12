import { database } from '../../database/database.js';
import type { HomeDevice } from '../../domain/device.js';
import type { DeviceRepositoryPort } from '../../ports/device-repository.port.js';

export class SqliteDeviceRepository implements DeviceRepositoryPort {
  list(): HomeDevice[] {
    const rows = database
      .prepare('SELECT * FROM devices ORDER BY created_at DESC')
      .all() as unknown as HomeDevice[];

    return rows;
  }

  findById(id: string): HomeDevice | null {
    const row = database.prepare('SELECT * FROM devices WHERE id = ?').get(id) as HomeDevice | undefined;
    return row ?? null;
  }

  markSeen(id: string, seenAt: string): boolean {
    const result = database.prepare('UPDATE devices SET last_seen_at = ? WHERE id = ?').run(seenAt, id);
    return (result.changes ?? 0) > 0;
  }

  save(device: HomeDevice): void {
    database
      .prepare(
        'INSERT INTO devices (id, name, kind, created_at, status, last_event_type, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(device.id, device.name, device.kind, device.created_at, 'unknown', null, null);
  }

  delete(id: string): boolean {
    const result = database.prepare('DELETE FROM devices WHERE id = ?').run(id);
    return (result.changes ?? 0) > 0;
  }
}
