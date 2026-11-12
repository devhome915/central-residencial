import type { Request, Response } from 'express';
import { EventService } from '../../application/event.service.js';
import type { CreateEventRequestDto } from '../../application/dto/create-event-request.dto.js';
import { ValidationError } from '../../application/errors/validation-error.js';

export class EventController {
  constructor(private readonly eventService: EventService) {}

  list = (_req: Request, res: Response): void => {
    res.json(this.eventService.listEvents());
  };

  create = (req: Request, res: Response): void => {
    try {
      const payload: CreateEventRequestDto = {
        device: req.body?.device,
        deviceId: req.body?.deviceId,
        type: req.body?.type,
        source: req.body?.source,
      };

      const event = this.eventService.createEvent(payload);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }

      console.error(error);
      res.status(500).json({ error: 'Erro interno ao registrar evento' });
    }
  };

  remove = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: 'Evento não informado' });
        return;
      }

      this.eventService.deleteEvent(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Evento não encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }

      console.error(error);
      res.status(500).json({ error: 'Erro interno ao remover evento' });
    }
  };
}
