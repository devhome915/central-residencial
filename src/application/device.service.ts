import type { HomeDevice } from '../domain/device.js';

export interface CreateDevicePayload {
  name?: unknown;
  kind?: unknown;
}

export interface CreateDeviceUseCasePort {
  execute(input: CreateDevicePayload): HomeDevice;
}

export interface ListDevicesUseCasePort {
  execute(): HomeDevice[];
}

export interface DeleteDeviceUseCasePort {
  execute(id: string): void;
}

export interface MarkDeviceSeenUseCasePort {
  execute(id: string): void;
}

export interface DeviceServicePort {
  createDevice(input: CreateDevicePayload): HomeDevice;
  listDevices(): HomeDevice[];
  deleteDevice(id: string): void;
  markDeviceSeen(id: string): void;
}

export class DeviceService implements DeviceServicePort {
  constructor(
    private readonly createDeviceUseCase: CreateDeviceUseCasePort,
    private readonly listDevicesUseCase: ListDevicesUseCasePort,
    private readonly deleteDeviceUseCase?: DeleteDeviceUseCasePort,
    private readonly markDeviceSeenUseCase?: MarkDeviceSeenUseCasePort,
  ) {}

  createDevice(input: CreateDevicePayload): HomeDevice {
    return this.createDeviceUseCase.execute(input);
  }

  listDevices(): HomeDevice[] {
    return this.listDevicesUseCase.execute();
  }

  deleteDevice(id: string): void {
    if (!this.deleteDeviceUseCase) {
      throw new Error('Dispositivo não encontrado');
    }

    this.deleteDeviceUseCase.execute(id);
  }

  markDeviceSeen(id: string): void {
    if (!this.markDeviceSeenUseCase) {
      throw new Error('Dispositivo não encontrado');
    }

    this.markDeviceSeenUseCase.execute(id);
  }
}
