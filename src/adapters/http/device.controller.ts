import type { Request, Response } from 'express';
import type { DeviceService } from '../../application/device.service.js';
import { ValidationError } from '../../application/errors/validation-error.js';

export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  list = (_req: Request, res: Response): void => {
    res.json(this.deviceService.listDevices());
  };

  create = (req: Request, res: Response): void => {
    try {
      const device = this.deviceService.createDevice({
        name: req.body?.name,
        kind: req.body?.kind,
      });

      res.status(201).json(device);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }

      console.error(error);
      res.status(500).json({ error: 'Erro interno ao registrar dispositivo' });
    }
  };

  remove = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: 'Dispositivo não informado' });
        return;
      }

      this.deviceService.deleteDevice(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Dispositivo não encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }

      console.error(error);
      res.status(500).json({ error: 'Erro interno ao remover dispositivo' });
    }
  };

  heartbeat = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: 'Dispositivo não informado' });
        return;
      }

      this.deviceService.markDeviceSeen(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Dispositivo não encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }

      console.error(error);
      res.status(500).json({ error: 'Erro interno ao atualizar conexão do dispositivo' });
    }
  };
}
