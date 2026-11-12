import { DatabaseSync } from 'node:sqlite';

export const database = new DatabaseSync('events.db');

database.exec('PRAGMA journal_mode = WAL;');
database.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    device TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);
database.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'online',
    last_event_type TEXT
  )
`);

const eventColumns = database.prepare('PRAGMA table_info(events)').all() as Array<{ name: string }>;
if (!eventColumns.some((column) => column.name === 'device_id')) {
  database.exec('ALTER TABLE events ADD COLUMN device_id TEXT');
}
if (!eventColumns.some((column) => column.name === 'source')) {
  database.exec("ALTER TABLE events ADD COLUMN source TEXT NOT NULL DEFAULT 'simulated'");
}

const deviceColumns = database.prepare('PRAGMA table_info(devices)').all() as Array<{ name: string }>;
if (!deviceColumns.some((column) => column.name === 'last_seen_at')) {
  database.exec('ALTER TABLE devices ADD COLUMN last_seen_at TEXT');
}
