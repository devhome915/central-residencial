import assert from 'node:assert/strict';
import test from 'node:test';
import { DeviceService } from './device.service.js';
import { ValidationError } from './errors/validation-error.js';
import { CreateDeviceUseCase } from './use-cases/create-device.use-case.js';
import { CreateEventUseCase } from './use-cases/create-event.use-case.js';
import { DeleteDeviceUseCase } from './use-cases/delete-device.use-case.js';
import { ListDevicesUseCase } from './use-cases/list-devices.use-case.js';
import { MarkDeviceSeenUseCase } from './use-cases/mark-device-seen.use-case.js';
import type { DeviceRepositoryPort } from '../ports/device-repository.port.js';
import type { HomeDevice } from '../domain/device.js';
import type { EventRepositoryPort } from '../ports/event-repository.port.js';
import type { HomeEvent } from '../domain/event.js';

class FakeDeviceRepository implements DeviceRepositoryPort {
  public devices: HomeDevice[] = [];

  list(): HomeDevice[] {
    return this.devices;
  }

  findById(id: string): HomeDevice | null {
    return this.devices.find((device) => device.id === id) ?? null;
  }

  markSeen(id: string, seenAt: string): boolean {
    const device = this.findById(id);
    if (!device) return false;
    device.last_seen_at = seenAt;
    return true;
  }

  save(device: HomeDevice): void {
    this.devices.push(device);
  }

  delete(id: string): boolean {
    const before = this.devices.length;
    this.devices = this.devices.filter((device) => device.id !== id);
    return this.devices.length !== before;
  }
}

class FakeEventRepository implements EventRepositoryPort {
  public events: HomeEvent[] = [];

  listRecent(): HomeEvent[] {
    return [...this.events].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  findLatestForDevice(deviceId: string, deviceName: string): HomeEvent | null {
    return this.listRecent().find((event) =>
      event.device_id === deviceId || (!event.device_id && event.device === deviceName),
    ) ?? null;
  }

  save(event: HomeEvent): void {
    this.events.push(event);
  }

  delete(id: string): boolean {
    const originalLength = this.events.length;
    this.events = this.events.filter((event) => event.id !== id);
    return this.events.length < originalLength;
  }
}

test('DeviceService should create and list devices', () => {
  const repository = new FakeDeviceRepository();
  const eventRepository = new FakeEventRepository();
  const service = new DeviceService(
    new CreateDeviceUseCase(repository),
    new ListDevicesUseCase(repository, eventRepository),
    new DeleteDeviceUseCase(repository),
    new MarkDeviceSeenUseCase(repository),
  );

  const created = service.createDevice({ name: 'Porta Garagem', kind: 'door' }) as HomeDevice;

  assert.equal(typeof created.id, 'string');
  assert.equal(service.listDevices().length, 1);
  assert.equal((service.listDevices()[0] as HomeDevice).name, 'Porta Garagem');
});

test('DeviceService should reject invalid device payloads', () => {
  const repository = new FakeDeviceRepository();
  const eventRepository = new FakeEventRepository();
  const service = new DeviceService(
    new CreateDeviceUseCase(repository),
    new ListDevicesUseCase(repository, eventRepository),
    new DeleteDeviceUseCase(repository),
    new MarkDeviceSeenUseCase(repository),
  );

  assert.throws(
    () => service.createDevice({ name: '', kind: 'door' }),
    (error: unknown) => error instanceof ValidationError && error.message === 'Informe name (1-80 caracteres) e kind valido',
  );
});

test('device state should follow the latest remaining event after an older event is deleted', () => {
  const deviceRepository = new FakeDeviceRepository();
  const eventRepository = new FakeEventRepository();
  const service = new DeviceService(
    new CreateDeviceUseCase(deviceRepository),
    new ListDevicesUseCase(deviceRepository, eventRepository),
    new DeleteDeviceUseCase(deviceRepository),
    new MarkDeviceSeenUseCase(deviceRepository),
  );
  const device = service.createDevice({ name: 'Porta da cozinha', kind: 'door' });

  eventRepository.save({
    id: 'open-1',
    device: device.name,
    device_id: device.id,
    type: 'door_open',
    source: 'simulated',
    created_at: '2026-01-01T10:00:00.000Z',
  });
  eventRepository.save({
    id: 'closed-1',
    device: device.name,
    device_id: device.id,
    type: 'door_closed',
    source: 'simulated',
    created_at: '2026-01-01T10:01:00.000Z',
  });
  eventRepository.save({
    id: 'open-2',
    device: device.name,
    device_id: device.id,
    type: 'door_open',
    source: 'simulated',
    created_at: '2026-01-01T10:02:00.000Z',
  });

  assert.equal(service.listDevices()[0].state, 'open');

  eventRepository.delete('open-2');
  assert.equal(service.listDevices()[0].state, 'closed');

  eventRepository.delete('closed-1');
  assert.equal(service.listDevices()[0].state, 'open');
});

test('device connectivity should distinguish unknown, online and offline', () => {
  const deviceRepository = new FakeDeviceRepository();
  const eventRepository = new FakeEventRepository();
  const service = new DeviceService(
    new CreateDeviceUseCase(deviceRepository),
    new ListDevicesUseCase(deviceRepository, eventRepository),
    new DeleteDeviceUseCase(deviceRepository),
    new MarkDeviceSeenUseCase(deviceRepository),
  );
  const device = service.createDevice({ name: 'Sensor Hall', kind: 'sensor' });

  assert.equal(service.listDevices()[0].connection_status, 'unknown');

  service.markDeviceSeen(device.id);
  assert.equal(service.listDevices()[0].connection_status, 'online');

  device.last_seen_at = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  assert.equal(service.listDevices()[0].connection_status, 'offline');
});

test('physical device events should link the device, update its state and mark it online', () => {
  const deviceRepository = new FakeDeviceRepository();
  const eventRepository = new FakeEventRepository();
  const service = new DeviceService(
    new CreateDeviceUseCase(deviceRepository),
    new ListDevicesUseCase(deviceRepository, eventRepository),
    new DeleteDeviceUseCase(deviceRepository),
    new MarkDeviceSeenUseCase(deviceRepository),
  );
  const device = service.createDevice({ name: 'Porta da cozinha', kind: 'door' });
  const createEvent = new CreateEventUseCase(eventRepository, undefined, deviceRepository);

  const event = createEvent.execute({
    device: 'nome que não deve prevalecer',
    deviceId: device.id,
    type: 'door_open',
    source: 'device',
  });
  const [updatedDevice] = service.listDevices();

  assert.equal(event.device, device.name);
  assert.equal(event.device_id, device.id);
  assert.equal(event.source, 'device');
  assert.equal(updatedDevice.state, 'open');
  assert.equal(updatedDevice.connection_status, 'online');
  assert.equal(updatedDevice.last_seen_at, event.created_at);
});
