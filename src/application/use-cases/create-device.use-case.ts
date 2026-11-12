import { createDevice, isValidDeviceKind, normalizeDeviceName } from '../../domain/device.js';
import type { DeviceRepositoryPort } from '../../ports/device-repository.port.js';
import { ValidationError } from '../errors/validation-error.js';

export class CreateDeviceUseCase {
  constructor(private readonly deviceRepository: DeviceRepositoryPort) {}

  execute(input: { name?: unknown; kind?: unknown }) {
    const name = normalizeDeviceName(input.name);

    if (!name) {
      throw new ValidationError('Informe name (1-80 caracteres) e kind valido');
    }

    if (!isValidDeviceKind(input.kind)) {
      throw new ValidationError('Informe name (1-80 caracteres) e kind valido');
    }

    const device = createDevice(name, input.kind);
    this.deviceRepository.save(device);

    return device;
  }
}
