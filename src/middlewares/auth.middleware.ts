import type { RequestHandler } from 'express';
import { validToken } from '../config/env.js';

export const requireAuth: RequestHandler = (req, res, next) => {
  const bearer = req.header('authorization')?.replace(/^Bearer\s+/i, '');

  if (!validToken(bearer)) {
    res.status(401).json({ error: 'Nao autorizado' });
    return;
  }

  next();
};
