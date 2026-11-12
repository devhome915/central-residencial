import type { EventResponseDto } from '../dto/event-response.dto.js';
import type { EventRepositoryPort } from '../../ports/event-repository.port.js';

export class ListEventsUseCase {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  execute(): EventResponseDto[] {
    return this.eventRepository.listRecent();
  }
}
