import assert from 'node:assert/strict';
import test from 'node:test';
import { EventService } from './event.service.js';
import { ValidationError } from './errors/validation-error.js';
import { CreateEventUseCase } from './use-cases/create-event.use-case.js';
import { DeleteEventUseCase } from './use-cases/delete-event.use-case.js';
import { ListEventsUseCase } from './use-cases/list-events.use-case.js';
import type { EventRepositoryPort } from '../ports/event-repository.port.js';
import type { EventPublisherPort } from '../ports/event-publisher.port.js';
import type { HomeEvent } from '../domain/event.js';

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

test('EventService should create and persist an event', () => {
  const repository = new FakeEventRepository();
  const publisher = new FakeEventPublisher();
  const service = new EventService(
    new CreateEventUseCase(repository, publisher),
    new ListEventsUseCase(repository),
    new DeleteEventUseCase(repository),
  );

  const event = service.createEvent({ device: 'Portão', type: 'door_open' });

  assert.equal(repository.savedEvents.length, 1);
  assert.equal(publisher.publishedEvents.length, 1);
  assert.equal(repository.savedEvents[0].id, event.id);
  assert.equal(publisher.publishedEvents[0].id, event.id);
  assert.equal(event.device, 'Portão');
  assert.equal(event.type, 'door_open');
  assert.ok(event.created_at.length > 0);
});

test('EventService should list stored events', () => {
  const repository = new FakeEventRepository();
  const service = new EventService(
    new CreateEventUseCase(repository),
    new ListEventsUseCase(repository),
    new DeleteEventUseCase(repository),
  );

  repository.savedEvents.push({
    id: 'event-1',
    device: 'Portão',
    type: 'door_open',
    created_at: '2026-01-01T00:00:00.000Z',
  });

  const events = service.listEvents();

  assert.equal(events.length, 1);
  assert.equal(events[0].id, 'event-1');
  assert.equal(events[0].device, 'Portão');
});

test('EventService should delete an existing event', () => {
  const repository = new FakeEventRepository();
  const service = new EventService(
    new CreateEventUseCase(repository),
    new ListEventsUseCase(repository),
    new DeleteEventUseCase(repository),
  );

  repository.savedEvents.push({
    id: 'event-1',
    device: 'Portão',
    type: 'door_open',
    created_at: '2026-01-01T00:00:00.000Z',
  });

  service.deleteEvent('event-1');

  assert.equal(repository.savedEvents.length, 0);
});

test('EventService should reject invalid device names', () => {
  const repository = new FakeEventRepository();
  const service = new EventService(
    new CreateEventUseCase(repository),
    new ListEventsUseCase(repository),
    new DeleteEventUseCase(repository),
  );

  assert.throws(
    () => service.createEvent({ device: '', type: 'door_open' }),
    (error: unknown) => error instanceof ValidationError && error.message === 'Informe device (1-80 caracteres) e type valido',
  );
});
