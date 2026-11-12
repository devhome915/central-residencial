import { Router } from 'express';
import type { EventService } from '../../application/event.service.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { EventController } from './event.controller.js';

export function createEventRoutes(eventService: EventService): Router {
  const controller = new EventController(eventService);
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  router.use('/api', requireAuth);
  router.get('/api/events', controller.list);
  router.post('/api/events', controller.create);
  router.delete('/api/events/:id', controller.remove);

  return router;
}
