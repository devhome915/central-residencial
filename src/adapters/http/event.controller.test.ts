import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import type { EventRepositoryPort } from '../../ports/event-repository.port.js';
import type { HomeEvent } from '../../domain/event.js';
import type { EventPublisherPort } from '../../ports/event-publisher.port.js';

process.env.API_TOKEN = '123456789012345678901234';

const { createApp } = await import('../../app.js');

class FakeEventRepository implements EventRepositoryPort {
  public savedEvents: HomeEvent[] = [];

  listRecent(): HomeEvent[] {
    return this.savedEvents;
  }

  findLatestForDevice(deviceId: string, deviceName: string): HomeEvent | null {
    return [...this.savedEvents]
      .filter((event) => event.device_id === deviceId || (!event.device_id && event.device === deviceName))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  }

  save(event: HomeEvent): void {
    this.savedEvents.push(event);
  }

  delete(id: string): boolean {
    const before = this.savedEvents.length;
    this.savedEvents = this.savedEvents.filter((event) => event.id !== id);
    return this.savedEvents.length !== before;
  }
}

class FakeEventPublisher implements EventPublisherPort {
  public publishedEvents: HomeEvent[] = [];

  publish(event: HomeEvent): void {
    this.publishedEvents.push(event);
  }
}

async function withTestServer(app: ReturnType<typeof createApp>) {
  const server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected server address to be a TCP socket object');
  }

  return {
    server,
    port: address.port,
  };
}

test('POST /api/events should create an event when authenticated', async () => {
  const repository = new FakeEventRepository();
  const publisher = new FakeEventPublisher();
  const app = createApp(publisher, repository);
  const { server, port } = await withTestServer(app);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify({ device: 'Portão', type: 'door_open' }),
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.device, 'Portão');
    assert.equal(body.type, 'door_open');
    assert.equal(repository.savedEvents.length, 1);
    assert.equal(publisher.publishedEvents.length, 1);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});

test('POST /api/events should reject invalid payloads', async () => {
  const repository = new FakeEventRepository();
  const app = createApp({ publish: () => undefined }, repository);
  const { server, port } = await withTestServer(app);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify({ device: '', type: 'door_open' }),
    });

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, 'Informe device (1-80 caracteres) e type valido');
    assert.equal(repository.savedEvents.length, 0);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});

test('GET /api/events should return the list from the repository', async () => {
  const repository = new FakeEventRepository();
  repository.savedEvents.push({
    id: 'event-1',
    device: 'Portão',
    type: 'door_open',
    created_at: '2026-01-01T00:00:00.000Z',
  });

  const app = createApp({ publish: () => undefined }, repository);
  const { server, port } = await withTestServer(app);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/events`, {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].device, 'Portão');
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});


test('DELETE /api/events/:id should remove an event', async () => {
  const repository = new FakeEventRepository();
  repository.savedEvents.push({
    id: 'event-1',
    device: 'Portão',
    type: 'door_open',
    created_at: '2026-01-01T00:00:00.000Z',
  });

  const app = createApp({ publish: () => undefined }, repository);
  const { server, port } = await withTestServer(app);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/events/event-1`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    });

    assert.equal(response.status, 204);
    assert.equal(repository.savedEvents.length, 0);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});
