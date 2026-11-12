import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { DeviceController } from './device.controller.js';
import type { DeviceService } from '../../application/device.service.js';

export function createDeviceRoutes(deviceService: DeviceService): Router {
  const controller = new DeviceController(deviceService);
  const router = Router();

  router.use('/api', requireAuth);
  router.get('/api/devices', controller.list);
  router.post('/api/devices', controller.create);
  router.delete('/api/devices/:id', controller.remove);
  router.post('/api/devices/:id/heartbeat', controller.heartbeat);

  return router;
}
