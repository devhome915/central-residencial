import 'dotenv/config';
import { timingSafeEqual } from 'node:crypto';

export const env = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  apiToken: process.env.API_TOKEN ?? '',

  tuya: {
    clientId: process.env.TUYA_CLIENT_ID ?? '',
    clientSecret: process.env.TUYA_CLIENT_SECRET ?? '',
    baseUrl: process.env.TUYA_BASE_URL ?? 'https://openapi.tuyaus.com',
  },
};

if (env.apiToken.length < 24 || env.apiToken === 'SUBSTITUA_POR_UM_TOKEN_LONGO_ALEATORIO') {
  throw new Error('Configure API_TOKEN com pelo menos 24 caracteres no arquivo .env');
}

export function validToken(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const candidate = Buffer.from(value);
  const expected = Buffer.from(env.apiToken);

  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
