import type { EventRepositoryPort } from '../../ports/event-repository.port.js';

export class DeleteEventUseCase {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  execute(id: string): void {
    const deleted = this.eventRepository.delete(id);

    if (!deleted) {
      throw new Error('Evento não encontrado');
    }
  }
}
