import type { CreateEventRequestDto } from '../dto/create-event-request.dto.js';
import type { EventResponseDto } from '../dto/event-response.dto.js';
import { ValidationError } from '../errors/validation-error.js';
import {
  createEvent,
  isValidEventSource,
  isValidEventType,
  normalizeDeviceName,
  type EventSource,
} from '../../domain/event.js';
import type { DeviceRepositoryPort } from '../../ports/device-repository.port.js';
import type { EventPublisherPort } from '../../ports/event-publisher.port.js';
import type { EventRepositoryPort } from '../../ports/event-repository.port.js';

export class CreateEventUseCase {
  constructor(
    private readonly eventRepository: EventRepositoryPort,
    private readonly eventPublisher?: EventPublisherPort,
    private readonly deviceRepository?: DeviceRepositoryPort,
  ) {}

  execute(input: CreateEventRequestDto): EventResponseDto {
    if (input.source !== undefined && !isValidEventSource(input.source)) {
      throw new ValidationError('Origem do evento invalida');
    }

    const source: EventSource = input.source === 'device' ? 'device' : 'simulated';
    const deviceId = input.deviceId === undefined
      ? null
      : typeof input.deviceId === 'string' && input.deviceId.trim()
        ? input.deviceId.trim()
        : null;

    if (input.deviceId !== undefined && !deviceId) {
      throw new ValidationError('Dispositivo invalido');
    }

    const registeredDevice = deviceId ? this.deviceRepository?.findById(deviceId) : null;
    const device = registeredDevice?.name ?? normalizeDeviceName(input.device);

    if (!device || (deviceId && !registeredDevice) || (source === 'device' && !deviceId)) {
      throw new ValidationError('Informe device (1-80 caracteres) e type valido');
    }

    if (!isValidEventType(input.type)) {
      throw new ValidationError('Informe device (1-80 caracteres) e type valido');
    }

    const event = createEvent(device, input.type, registeredDevice?.id ?? null, source);
    this.eventRepository.save(event);

    if (source === 'device' && registeredDevice) {
      this.deviceRepository?.markSeen(registeredDevice.id, event.created_at);
    }

    this.eventPublisher?.publish(event);
    return event;
  }
}
