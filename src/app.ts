import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDeviceRoutes } from './adapters/http/device.routes.js';
import { createEventRoutes } from './adapters/http/event.routes.js';
import { SqliteDeviceRepository } from './adapters/repositories/sqlite-device.repository.js';
import { SqliteEventRepository } from './adapters/repositories/sqlite-event.repository.js';
import { DeviceService } from './application/device.service.js';
import { EventService } from './application/event.service.js';
import { CreateDeviceUseCase } from './application/use-cases/create-device.use-case.js';
import { CreateEventUseCase } from './application/use-cases/create-event.use-case.js';
import { DeleteDeviceUseCase } from './application/use-cases/delete-device.use-case.js';
import { DeleteEventUseCase } from './application/use-cases/delete-event.use-case.js';
import { ListDevicesUseCase } from './application/use-cases/list-devices.use-case.js';
import { ListEventsUseCase } from './application/use-cases/list-events.use-case.js';
import { MarkDeviceSeenUseCase } from './application/use-cases/mark-device-seen.use-case.js';
import type { DeviceRepositoryPort } from './ports/device-repository.port.js';
import type { EventPublisherPort } from './ports/event-publisher.port.js';
import type { EventRepositoryPort } from './ports/event-repository.port.js';

export function createApp(
  eventPublisher: EventPublisherPort = { publish: () => undefined },
  eventRepository: EventRepositoryPort = new SqliteEventRepository(),
  deviceRepository: DeviceRepositoryPort = new SqliteDeviceRepository(),
) {
  const createEventUseCase = new CreateEventUseCase(eventRepository, eventPublisher, deviceRepository);
  const listEventsUseCase = new ListEventsUseCase(eventRepository);
  const deleteEventUseCase = new DeleteEventUseCase(eventRepository);
  const eventService = new EventService(createEventUseCase, listEventsUseCase, deleteEventUseCase);

  const createDeviceUseCase = new CreateDeviceUseCase(deviceRepository);
  const listDevicesUseCase = new ListDevicesUseCase(deviceRepository, eventRepository);
  const deleteDeviceUseCase = new DeleteDeviceUseCase(deviceRepository);
  const markDeviceSeenUseCase = new MarkDeviceSeenUseCase(deviceRepository);
  const deviceService = new DeviceService(
    createDeviceUseCase,
    listDevicesUseCase,
    deleteDeviceUseCase,
    markDeviceSeenUseCase,
  );

  const app = express();

  app.use(express.json({ limit: '10kb' }));
  app.use(createEventRoutes(eventService));
  app.use(createDeviceRoutes(deviceService));

  const here = dirname(fileURLToPath(import.meta.url));
  app.use(express.static(join(here, '..', 'public')));

  return app;
}

export const app = createApp();
