import { SetMetadata } from '@nestjs/common';

export const CAPABILITY_KEY = 'capabilities';
export const CapabilityRequired = (...caps: string[]) =>
  SetMetadata(CAPABILITY_KEY, caps);
