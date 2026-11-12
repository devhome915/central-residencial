import type { CreateEventRequestDto } from './dto/create-event-request.dto.js';
import type { EventResponseDto } from './dto/event-response.dto.js';

export interface CreateEventUseCasePort {
  execute(input: CreateEventRequestDto): EventResponseDto;
}

export interface ListEventsUseCasePort {
  execute(): EventResponseDto[];
}

export interface DeleteEventUseCasePort {
  execute(id: string): void;
}

export class EventService {
  constructor(
    private readonly createEventUseCase: CreateEventUseCasePort,
    private readonly listEventsUseCase: ListEventsUseCasePort,
    private readonly deleteEventUseCase?: DeleteEventUseCasePort,
  ) {}

  listEvents(): EventResponseDto[] {
    return this.listEventsUseCase.execute();
  }

  createEvent(input: CreateEventRequestDto): EventResponseDto {
    return this.createEventUseCase.execute(input);
  }

  deleteEvent(id: string): void {
    if (!this.deleteEventUseCase) {
      throw new Error('Evento não encontrado');
    }

    this.deleteEventUseCase.execute(id);
  }
}
